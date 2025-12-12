import type {
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class BotPenguinApi implements ICredentialType {
	name = 'botPenguinApi';
	displayName = 'BotPenguin API';
	documentationUrl = 'https://botpenguin.com';
	icon: Icon = { light: 'file:../nodes/Example/example.svg', dark: 'file:../nodes/Example/example.dark.svg' };

	properties: INodeProperties[] = [
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			default: '',
			typeOptions: { password: true },
			description: 'API access token (passed as query param access_token)',
			required: true,
		},
	];

	authenticate = {
		type: 'generic' as const,
		properties: {
			qs: {
				access_token: '={{$credentials.accessToken}}',
			},
		},
	};

	testedBy = ['e1Test'];

	test: ICredentialTestRequest = {
		request: {
			method: 'GET',
			baseURL: 'https://e1-api.botpenguin.com',
			url: '/inbox/users/import',
		},
	};
}

