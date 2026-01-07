import type { ICredentialTestRequest, ICredentialType, Icon, INodeProperties } from 'n8n-workflow';

export class BotPenguinApi implements ICredentialType {
	name = 'botPenguinApi';
	displayName = 'BotPenguin API';
	documentationUrl = 'https://botpenguin.com';
	icon: Icon = 'file:botpenguin.svg';

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
			displayName: 'Context Type',
			name: 'contextType',
			type: 'options',
			default: '',
			options: [
				{ name: 'Bot', value: 'bot' },
				{ name: 'Agent', value: 'agent' },
			],
			required: true,
		},
		{
			displayName: 'Bot ID',
			name: 'botId',
			type: 'string',
			default: '',
			description: 'Bot identifier',
			required: true,
			displayOptions: {
				show: {
					contextType: ['bot'],
				},
			},
		},
		{
			displayName: 'Agent ID',
			name: 'agentId',
			type: 'string',
			default: '',
			description: 'Agent identifier',
			required: true,
			displayOptions: {
				show: {
					contextType: ['agent'],
				},
			},
		},
		{
			displayName: 'Platform',
			name: 'botPlatform',
			type: 'options',
			default: 'WhatsApp',
			description: 'Platform associated with the bot',
			options: [
				{ name: 'WhatsApp', value: 'whatsapp' },
				{ name: 'Instagram', value: 'instagram' },
				{ name: 'Facebook', value: 'facebook' },
				{ name: 'Telegram', value: 'telegram' },
				{ name: 'Website', value: 'website' },
				{ name: 'SMS', value: 'sms' }
			],
			required: true,
			displayOptions: {
				show: {
					contextType: ['bot'],
				},
			},
		},
		{
			displayName: 'Platform',
			name: 'agentPlatform',
			type: 'options',
			default: 'whatsApp',
			description: 'Platform associated with the agent',
			options: [
				{ name: 'WhatsApp', value: 'whatsapp' },
				{ name: 'Instagram', value: 'instagram' },
				{ name: 'Telegram', value: 'telegram' },
				{ name: 'Website', value: 'website' },
			],
			required: true,
			displayOptions: {
				show: {
					contextType: ['agent'],
				},
			},
		}
	];

	authenticate = {
		type: 'generic' as const,
		properties: {
			qs: {
				access_token: '={{$credentials.accessToken}}',
				botId: '={{$credentials.contextType === "bot" ? $credentials.botId : undefined}}',
				agentId: '={{$credentials.contextType === "agent" ? $credentials.agentId : undefined}}',
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
				botId: '={{$credentials.contextType === "bot" ? $credentials.botId : undefined}}',
				agentId: '={{$credentials.contextType === "agent" ? $credentials.agentId : undefined}}',
				platform: '={{$credentials.contextType === "agent" ? $credentials.agentPlatform : $credentials.botPlatform}}',
			},
			json: true,
		},
	};

}

