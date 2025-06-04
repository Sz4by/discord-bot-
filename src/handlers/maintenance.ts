import * as k8s from '@kubernetes/client-node';
import { captureException } from '@sentry/node';
import type { ChatInputCommandInteraction } from 'discord.js';
import logger from '../utils/logger';

const DEPLOYMENT_NAME = 'discord-bot';
const DEPLOYMENT_NAMESPACE = 'discord-bot';

export default async function maintenanceCommandHandler(
	interaction: ChatInputCommandInteraction,
) {
	await interaction.reply('🔧 Activating maintenance mode...');

	try {
		const kc = new k8s.KubeConfig();
		
		kc.loadFromCluster();

		const k8sAppsV1Api = kc.makeApiClient(k8s.AppsV1Api);

		await k8sAppsV1Api.deleteNamespacedDeployment({
			name: DEPLOYMENT_NAME,
			namespace: DEPLOYMENT_NAMESPACE,
		});

		await interaction.editReply(
			'✅ Maintenance mode activated! Deployment deleted.',
		);

		logger.info({}, 'Bot deployment deleted for maintenance');
	} catch (error) {
		logger.error(error, 'Failed to delete deployment for maintenance');
		captureException(error);

		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error occurred';

		await interaction.editReply(
			`❌ Failed to activate maintenance mode:
\`\`\`${errorMessage}\`\`\`

Please check the logs or try again later.`,
		);
	}
}
