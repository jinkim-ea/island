export declare namespace IntervalHelper {
    function getIntervalList(): number[];
    function setIslandInterval(handler: Function, time: any): Promise<number>;
    function purge(): Promise<void | {}>;
}
