import * as amqp from 'amqplib';
import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as util from 'util';

import { logger } from '../utils/logger';

export interface AmqpOptions {
  url: string;
  socketOptions?: { noDelay?: boolean, heartbeat?: number };
  poolSize?: number ;
  name?: string;
}

export interface ChannelInfo {
  channel: amqp.Channel;
  date: number;
}

export class AmqpChannelPoolService {
  static DEFAULT_POOL_SIZE: number = 100;

  private connection: amqp.Connection;
  private options: AmqpOptions;
  private openChannels: amqp.Channel[] = [];
  private idleChannels: ChannelInfo[] = [];
  private initResolver: Bluebird.Resolver<void>;

  constructor() {
    this.initResolver = Bluebird.defer<void>();
  }

  async initialize(options: AmqpOptions): Promise<void> {
    options.poolSize = options.poolSize || AmqpChannelPoolService.DEFAULT_POOL_SIZE;
    this.options = options;
    logger.info(`connecting to broker ${util.inspect(options, { colors: true })}`);
    try {
      const connection = await amqp.connect(options.url, options.socketOptions);

      logger.info(`connected to ${options.url} for ${options.name}`);
      this.connection = connection;
      this.initResolver.resolve();
    } catch (e) { this.initResolver.reject(e); }

    return Promise.resolve(this.initResolver.promise);
  }

  async waitForInit(): Promise<void> {
    return this.initResolver.promise;
  }

  async purge(): Promise<void> {
    return this.connection.close();
  }

  async acquireChannel(): Promise<amqp.Channel> {
    return Promise.resolve(Bluebird.try(() => {
      const info = this.idleChannels.shift();
      return info && info.channel || this.createChannel();
    }));
  }

  async releaseChannel(channel: amqp.Channel, reusable: boolean = false): Promise<void> {
    if (!_.includes(this.openChannels, channel)) {
      return;
    }
    if (reusable && this.idleChannels.length < (this.options.poolSize as number)) {
      this.idleChannels.push({ channel, date: +new Date() });
      return;
    }
    return channel.close();
  }

  async usingChannel<T>(task: (channel: amqp.Channel) => PromiseLike<T>) {
    return Bluebird.using(this.getChannelDisposer(), task);
  }

  getChannelDisposer(): Bluebird.Disposer<amqp.Channel> {
    return Bluebird.resolve(this.acquireChannel())
      .disposer((channel: amqp.Channel) => {
        this.releaseChannel(channel);
      });
  }

  private async createChannel(): Promise<amqp.Channel> {
    const channel = await this.connection.createChannel();

    this.setChannelEventHandler(channel);
    this.openChannels.push(channel);
    return channel;
  }

  private setChannelEventHandler(channel: amqp.Channel) {
    channel
      .on('error', err => {
        logger.notice('amqp channel error:', err);
        if (err.stack) {
          logger.debug(err.stack);
        }
      })
      .on('close', () => {
        _.remove(this.idleChannels, (cur: ChannelInfo) => {
          return cur.channel === channel;
        });
        _.pull(this.openChannels, channel);
      });
  }
}
