import { ClientEventModule } from "reciple";

export class ClientReadyEvent extends ClientEventModule<'clientReady'> {
    public event = 'clientReady' as const;
    public once = false;

    public onEvent(): void {
        this.client.logger.info('Client is ready!');
    }
}

export default new ClientReadyEvent();
