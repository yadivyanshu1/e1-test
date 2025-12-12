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
						name: 'Create Contact',
						value: 'createContact',
						action: 'Create a contact',
						description: 'Create a contact in BotPenguin',
					},
				],
				default: 'createContact',
			},
			{
				displayName: 'Name',
				name: 'userProvidedName',
				type: 'string',
				default: '',
				placeholder: 'Jane Doe',
				required: true,
				description: 'Full name of the contact',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				default: '',
				placeholder: 'jane@example.com',
				description: 'Email address of the contact',
			},
			{
				displayName: 'Phone Number',
				name: 'phoneNumber',
				type: 'string',
				default: '',
				placeholder: '9876543210',
				description: 'Phone number without country code',
			},
			{
				displayName: 'Phone Prefix',
				name: 'phonePrefix',
				type: 'string',
				default: '91',
				placeholder: '91',
				description: 'Country calling code (prefix) - Defaults to 91',
			},
			{
				displayName: 'Tags',
				name: 'tags',
				type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				default: [],
				description: 'Tags to associate with the contact',
			},
			{
				displayName: 'Attributes (JSON)',
				name: 'attributes',
				type: 'json',
				default: '[]',
				description: 'Optional attributes array as JSON',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const userProvidedName = this.getNodeParameter('userProvidedName', itemIndex) as string;
				const email = this.getNodeParameter('email', itemIndex, '') as string;
				const phoneNumber = this.getNodeParameter('phoneNumber', itemIndex, '') as string;
				const phonePrefix = this.getNodeParameter('phonePrefix', itemIndex, '') as string;
				const tagsParam = this.getNodeParameter('tags', itemIndex, []) as string[];
				const tags = Array.isArray(tagsParam) ? tagsParam : [];
				const attributesParam = this.getNodeParameter('attributes', itemIndex, []) as unknown;
				const attributes = Array.isArray(attributesParam) ? attributesParam : [];

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
							tags: tags.length ? tags : undefined,
							attributes: attributes.length ? attributes : undefined,
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
					},
					json: true,
				});

				const responseItems = Array.isArray(response) ? response : [response];
				for (const entry of responseItems) {
					returnData.push({ json: entry as IDataObject });
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

