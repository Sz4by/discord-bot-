import { captureException } from '@sentry/node';
import type { ChatInputCommandInteraction } from 'discord.js';
import createK8sClient, {
	DEPLOYMENT_NAME,
	DEPLOYMENT_NAMESPACE,
} from '../utils/k8sClient';
import logger from '../utils/logger';

export default async function maintenanceCommandHandler(
	interaction: ChatInputCommandInteraction,
) {
	await interaction.reply('🔧 Activating maintenance mode...');

	try {
		const k8sAppsV1Api = createK8sClient();

		await interaction.editReply(
			'✅ Maintenance mode activated! Bot will shut down in a few seconds...',
		);

		logger.info({}, 'Maintenance mode activated, deleting deployment...');

		await k8sAppsV1Api.deleteNamespacedDeployment({
			name: DEPLOYMENT_NAME,
			namespace: DEPLOYMENT_NAMESPACE,
		});
	} catch (error) {
		logger.error(error, 'Failed to delete deployment for maintenance');
		captureException(error);

		await interaction.editReply(
			'❌ Failed to activate maintenance mode. Please check the logs or try again later.',
		);
	}
}
