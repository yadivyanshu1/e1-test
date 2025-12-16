import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

interface ContactPhone {
	number?: string;
	prefix?: string;
}

interface ContactDetails {
	email?: string;
	phone?: ContactPhone;
}

interface ContactPayload {
	profile: {
		userDetails: {
			userProvidedName: string;
			contact?: ContactDetails;
			tags?: string[];
			attributes?: unknown[];
		};
	};
}

export class E1Test implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'E1 Test',
		name: 'e1Test',
		icon: 'file:../Example/example.svg',
		group: ['transform'],
		version: 1,
		description: 'Create contacts in BotPenguin (E1 test).',
		defaults: {
			name: 'E1 Test',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'botPenguinApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Add a Contact',
						value: 'createContact',
						action: 'Add a contact',
						description: 'Create a contact in BotPenguin.',
					},
					{
						name: 'Update Contact Attributes',
						value: 'updateAttributes',
						action: 'Update contact attributes',
						description: 'Update a contact attribute in BotPenguin.',
					},
					{
						name: 'Send Session Message',
						value: 'sendSessionMessage',
						action: 'Send a session message',
						description: 'Send a session message.',
					},
				],
				default: 'createContact',
			},
			{
				displayName: 'Phone Prefix',
				name: 'phonePrefix',
				type: 'string',
				default: '91',
				placeholder: '91',
				description: 'Country calling code (prefix).',
				required: true,
				displayOptions: {
					show: {
						operation: ['createContact'],
					},
				},
			},
			{
				displayName: 'Phone Number',
				name: 'phoneNumber',
				type: 'string',
				default: '',
				placeholder: '9876543210',
				description: 'Phone number without country code.',
				required: true,
				displayOptions: {
					show: {
						operation: ['createContact'],
					},
				},
			},
			{
				displayName: 'Name',
				name: 'userProvidedName',
				type: 'string',
				default: '',
				placeholder: 'Jane Doe',
				required: true,
				description: 'Full name of the contact.',
				displayOptions: {
					show: {
						operation: ['createContact'],
					},
				},
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				default: '',
				placeholder: 'jane@example.com',
				description: 'Email address of the contact.',
				displayOptions: {
					show: {
						operation: ['createContact'],
					},
				},
			},
			{
				displayName: 'Search',
				name: 'search',
				type: 'string',
				default: '',
				placeholder: 'email / WhatsApp number with country code / UUID',
				description:
					'Please provide any one of the email, WhatsApp number, or UUID to update the user contact custom attribute. WhatsApp numbers should include the country code; only numeric values are allowed.',
				required: true,
				displayOptions: {
					show: {
						operation: ['updateAttributes'],
					},
				},
			},
			{
				displayName: 'Attribute Key',
				name: 'attributeKey',
				type: 'string',
				default: '',
				placeholder: 'attribute key',
				description: 'Enter the key of the attribute that needs to be updated here.',
				required: true,
				displayOptions: {
					show: {
						operation: ['updateAttributes'],
					},
				},
			},
			{
				displayName: 'Value',
				name: 'attributeValue',
				type: 'string',
				default: '',
				placeholder: 'new value',
				description: 'Enter the value to be updated here.',
				required: true,
				displayOptions: {
					show: {
						operation: ['updateAttributes'],
					},
				},
			},
			{
				displayName: 'Search',
				name: 'searchMessage',
				type: 'string',
				default: '',
				placeholder: 'email / WhatsApp number with country code / UUID',
				description:
					'Please provide any one of the email, WhatsApp number, or UUID to send a message. WhatsApp numbers should include the country code; only numeric values are allowed.',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendSessionMessage'],
					},
				},
			},
			{
				displayName: 'Message',
				name: 'messageText',
				type: 'string',
				default: '',
				placeholder: 'Hello!',
				description: 'Enter the message text to be sent.',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendSessionMessage'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const operation = this.getNodeParameter('operation', itemIndex) as string;
				const credentials = await this.getCredentials('botPenguinApi');
				const botId = (credentials?.botId as string) || '';
				const accessToken = (credentials?.accessToken as string) || '';
				const platform =
					typeof credentials?.platform === 'string'
						? (credentials.platform as string).toLowerCase()
						: undefined;

				if (operation === 'createContact') {
					const userProvidedName = this.getNodeParameter('userProvidedName', itemIndex) as string;
					const email = this.getNodeParameter('email', itemIndex, '') as string;
					const phoneNumber = this.getNodeParameter('phoneNumber', itemIndex, '') as string;
					const phonePrefix = this.getNodeParameter('phonePrefix', itemIndex, '') as string;

					const contact: ContactDetails = {};
					if (email) {
						contact.email = email;
					}
					if (phoneNumber) {
						contact.phone = {
							number: phoneNumber,
							prefix: phonePrefix || undefined,
						};
					}

					const payload: ContactPayload = {
						profile: {
							userDetails: {
								userProvidedName,
								contact: Object.keys(contact).length ? contact : undefined,
							},
						},
					};

					const response = await this.helpers.httpRequestWithAuthentication.call(this, 'botPenguinApi', {
						method: 'POST',
						url: 'https://e1-api.botpenguin.com/inbox/users/import',
						body: [payload],
						headers: {
							Accept: '*/*',
							'Content-Type': 'application/json',
							authtype: 'Key',
							botId,
						},
						qs: {
							botId,
						},
						json: true,
					});

					const responseItems = Array.isArray(response) ? response : [response];
					for (const entry of responseItems) {
						returnData.push({ json: entry as IDataObject });
					}
				} else if (operation === 'updateAttributes') {
					const search = this.getNodeParameter('search', itemIndex) as string;
					const attributeKey = this.getNodeParameter('attributeKey', itemIndex) as string;
					const attributeValue = this.getNodeParameter('attributeValue', itemIndex) as string;

					const body = {
						search,
						attributes: {
							[attributeKey]: attributeValue,
						},
						botId,
						platform,
					};

					const response = await this.helpers.httpRequestWithAuthentication.call(this, 'botPenguinApi', {
						method: 'PUT',
						url: 'https://e1-api.botpenguin.com/integrations/custom-app/update-user-attributes',
						body,
						headers: {
							Accept: '*/*',
							'Content-Type': 'application/json',
							authtype: 'Key',
							Authorization: `Bearer ${accessToken}`,
						},
						json: true,
					});

					const responseItems = Array.isArray(response) ? response : [response];
					for (const entry of responseItems) {
						returnData.push({ json: entry as IDataObject });
					}
				} else if (operation === 'sendSessionMessage') {
					const search = this.getNodeParameter('searchMessage', itemIndex) as string;
					const messageText = this.getNodeParameter('messageText', itemIndex) as string;

					const body = {
						text: messageText,
						search,
						channel: platform
					};

					const response = await this.helpers.httpRequestWithAuthentication.call(this, 'botPenguinApi', {
						method: 'POST',
						url: 'https://e1-api.botpenguin.com/integrations/custom-app/send-message-to-plugin',
						body,
						headers: {
							Accept: '*/*',
							'Content-Type': 'application/json',
							authtype: 'Key',
							Authorization: `Bearer ${accessToken}`,
							botId,
						},
						json: true,
					});

					const responseItems = Array.isArray(response) ? response : [response];
					for (const entry of responseItems) {
						returnData.push({ json: entry as IDataObject });
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: itemIndex,
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), error, { itemIndex });
			}
		}

		return [returnData];
	}
}

