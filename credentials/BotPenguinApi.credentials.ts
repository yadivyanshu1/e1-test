import type { ICredentialTestRequest, ICredentialType, Icon, INodeProperties } from 'n8n-workflow';

export class BotPenguinApi implements ICredentialType {
	name = 'botPenguinApi';
	displayName = 'BotPenguin API';
	documentationUrl = 'https://botpenguin.com';
	icon: Icon = { light: 'file:../nodes/Example/example.svg', dark: 'file:../nodes/Example/example.dark.svg' };

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'accessToken',
			type: 'string',
			default: '',
			typeOptions: { password: true },
			description: 'API access token',
			required: true,
		},
		{
			displayName: 'Bot ID',
			name: 'botId',
			type: 'string',
			default: '',
			description: 'Bot identifier',
			required: true,
		},
		{
			displayName: 'Platform',
			name: 'platform',
			type: 'options',
			default: 'WhatsApp',
			description: 'Platform associated with the bot',
			options: [
				{ name: 'WhatsApp', value: 'WhatsApp' },
				{ name: 'Instagram', value: 'Instagram' },
				{ name: 'Facebook', value: 'Facebook' },
				{ name: 'Telegram', value: 'Telegram' },
				{ name: 'Website', value: 'Website' },
			],
			required: true,
		},
	];

	authenticate = {
		type: 'generic' as const,
		properties: {
			qs: {
				access_token: '={{$credentials.accessToken}}',
				botId: '={{$credentials.botId}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://e1-api.botpenguin.com',
			url: '/integrations/custom-app/general-authentication',
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				authtype: 'Key',
				Authorization: '=Bearer {{$credentials.accessToken}}',
			},
			body: {
				slug: 'n8n',
				botId: '={{$credentials.botId}}',
				platform: '={{$credentials.platform}}',
			},
			json: true,
		},
	};

}

