import type {
	IHookFunctions,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
} from 'n8n-workflow';

import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class E1TestTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'E1 Test Trigger',
		name: 'e1TestTrigger',
		icon: 'file:../Example/example.svg',
		group: ['trigger'],
		version: 1,
		description: 'Triggers when a new contact is created in BotPenguin',
		defaults: {
			name: 'On Contact Created',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'botPenguinApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'contact-created',
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'hidden',
				default: 'newLeadHook',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				// For external webhooks, we can't easily check if it exists, so return false to trigger create
				return false;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				const credentials = await this.getCredentials('botPenguinApi');
				const webhookUrl = this.getNodeWebhookUrl('default');

				this.logger.info(`E1TestTrigger: Subscribing to BotPenguin webhook. Webhook URL: ${webhookUrl}`);

				const body = {
					webhookUrl,
					botId: credentials.botId,
					event: 'newLeadHook',
					slug: 'make',
					category: 'make',
					platform: credentials.platform,
					subscribe: true,
				};

				this.logger.info(`E1TestTrigger: Subscribe payload: ${JSON.stringify(body)}`);

				try {
					const response = await this.helpers.httpRequestWithAuthentication.call(this, 'botPenguinApi', {
						method: 'POST',
						url: 'https://e1-api.botpenguin.com/integrations/custom-app/subscribe-trigger-event',
						body,
						headers: {
							Accept: '*/*',
							'Content-Type': 'application/json',
							authType: 'Key',
							Authorization: `Bearer ${credentials.accessToken}`,
						},
						json: true,
					});
					this.logger.info(`E1TestTrigger: Subscribe API success. Response: ${JSON.stringify(response)}`);
				} catch (error) {
					this.logger.error(`E1TestTrigger: Subscribe API failed. Error: ${error}`);
					throw new NodeOperationError(this.getNode(), 'Failed to subscribe to BotPenguin webhook');
				}
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				const credentials = await this.getCredentials('botPenguinApi');
				const webhookUrl = this.getNodeWebhookUrl('default');

				const body = {
					webhookUrl,
					botId: credentials.botId,
					event: 'newLeadHook',
					slug: 'make',
					category: 'make',
					platform: credentials.platform,
					subscribe: false,
				};

				try {
					await this.helpers.httpRequestWithAuthentication.call(this, 'botPenguinApi', {
						method: 'POST',
						url: 'https://e1-api.botpenguin.com/integrations/custom-app/subscribe-trigger-event',
						body,
						headers: {
							Accept: '*/*',
							'Content-Type': 'application/json',
							authType: 'Key',
							Authorization: `Bearer ${credentials.accessToken}`,
						},
						json: true,
					});
				} catch {
					// Silent
				}
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
        this.logger.info(`E1TestTrigger: Webhook received. Body: ${JSON.stringify(this.getBodyData())}`);
		const body = this.getBodyData();

		const output = {
			event: 'contact.created',
			app: 'botpenguin',
			botId: body.botId,
			platform: body.platform,
			contact: body.data ?? body,
			timestamp: new Date().toISOString(),
		};

		return {
			workflowData: [
				[
					{
						json: output,
					},
				],
			],
		};
	}
}