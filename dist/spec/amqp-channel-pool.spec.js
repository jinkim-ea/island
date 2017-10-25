"use strict";
const amqp_channel_pool_service_1 = require("../services/amqp-channel-pool-service");
describe('AmqpChannelPool', () => {
    const amqpChannelPool = new amqp_channel_pool_service_1.AmqpChannelPoolService();
    beforeAll(done => {
        amqpChannelPool.initialize({
            url: process.env.RABBITMQ_HOST || 'amqp://rabbitmq:5672'
        })
            .then(done)
            .catch(done.fail);
    });
    it('can acquire a channel and release it', done => {
        amqpChannelPool.acquireChannel()
            .then(channel => {
            expect(channel).not.toBeUndefined();
            const exchange = `spec.temp.${+new Date()}`;
            Promise.resolve(channel.assertExchange(exchange, 'fanout', { autoDelete: true }))
                .then(() => channel.deleteExchange(exchange))
                .then(() => amqpChannelPool.releaseChannel(channel));
        })
            .then(done)
            .catch(done.fail);
    });
    it('can use channel disposer', done => {
        amqpChannelPool.usingChannel(channel => {
            const exchange = `spec.temp.${+new Date()}`;
            return channel.assertExchange(exchange, 'fanout', { autoDelete: true })
                .then(() => channel.deleteExchange(exchange));
        })
            .then(done)
            .catch(done.fail);
    });
    afterAll(done => {
        amqpChannelPool.purge()
            .then(done)
            .catch(done.fail);
    });
});
//# sourceMappingURL=amqp-channel-pool.spec.js.map