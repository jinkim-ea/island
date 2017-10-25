"use strict";
const amqp = require("amqplib");
const Promise = require("bluebird");
const message_broker_service_1 = require("../services/message-broker-service");
describe('msg-broker test:', () => {
    let brokerService1;
    let brokerService2;
    let connection;
    beforeAll(done => {
        amqp.connect(process.env.RABBITMQ_HOST || 'amqp://192.168.99.100:5672')
            .then((conn) => {
            connection = conn;
            brokerService1 = new message_broker_service_1.default(conn, 'service1');
            brokerService2 = new message_broker_service_1.default(conn, 'service2');
            Promise.all([brokerService1.initialize(), brokerService2.initialize()])
                .then(() => {
                return Promise.all([brokerService1.startConsume(), brokerService2.startConsume()]);
            })
                .then(() => done());
        });
    });
    const pattern = 'aaa.bbb.ccc';
    it('can send a message', done => {
        brokerService1.subscribe(pattern, msg => {
            expect(msg.hello).toBe('world');
            brokerService1.unsubscribe(pattern).then(() => done());
        })
            .then(res => brokerService2.publish(pattern, { hello: 'world' }))
            .catch(err => done.fail(err));
    });
    it('can send a pattern message #1', done => {
        brokerService1.subscribe('#.ccc', msg => {
            expect(msg.hello).toBe('world');
            brokerService1.unsubscribe('#.ccc').then(() => done());
        }).then(() => {
            brokerService2.publish(pattern, { hello: 'world' });
        }).catch(err => done.fail(err));
    });
    it('can send a pattern message #2', done => {
        brokerService1.subscribe('*.bbb.ccc', msg => {
            expect(msg.hello).toBe('world');
            brokerService1.unsubscribe('*.bbb.ccc').then(() => done());
        }).then(() => {
            brokerService2.publish(pattern, { hello: 'world' });
        }).catch(err => done.fail(err));
    });
    it('can send a pattern message #3', done => {
        brokerService1.subscribeFanout('#.ccc', msg => {
            expect(msg.hello).toBe('world');
            brokerService1.unsubscribeFanout('#.ccc').then(() => done());
        }).then(() => {
            brokerService2.publish(pattern, { hello: 'world' });
        }).catch(err => done.fail(err));
    });
    afterAll(done => {
        brokerService1.purge()
            .then(() => brokerService2.purge())
            .then(() => connection.close())
            .then(done, done.fail);
    });
});
//# sourceMappingURL=message-broker.spec.js.map