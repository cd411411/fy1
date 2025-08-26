// src/utils/events.ts (升级版，类型安全且不依赖DOM)

// ==================== 类型定义 ====================
/**
 * 事件回调函数类型，接收一个可选的、任意类型的 data 参数
 */
type EventCallback = (data?: any) => void;

/**
 * 事件总线接口，描述事件总线的方法
 */
interface IEventBus {
  /**
   * 注册事件监听器
   * @param event 事件名称
   * @param callback 事件触发时执行的回调函数
   */
  on(event: string, callback: EventCallback): void;
  
  /**
   * 触发事件
   * @param event 要触发的事件名称
   * @param data (可选) 要传递给回调函数的数据
   */
  dispatch(event: string, data?: any): void;
  
  /**
   * 移除事件监听器
   * @param event 事件名称
   * @param callback 要移除的回调函数
   */
  off(event: string, callback: EventCallback): void;
}

// ==================== 事件总线实现 ====================
/**
 * 一个类型安全的、内存中的事件总线。
 * 它不依赖于浏览器的 document 对象，更适合React应用的状态通信。
 */
class EventBus implements IEventBus {
  /**
   * 存储所有事件监听器的对象
   * 键是事件名(string)，值是该事件的回调函数数组(EventCallback[])
   */
  private listeners: { [key: string]: EventCallback[] } = {};

  /**
   * 注册一个事件监听器
   * @param event 事件名称
   * @param callback 事件触发时执行的回调函数
   */
  public on(event: string, callback: EventCallback): void {
    // 如果这个事件还没有被监听过，先初始化一个空数组
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    // 将新的回调函数添加到监听器数组中
    this.listeners[event].push(callback);
  }

  /**
   * 触发一个事件
   * @param event 要触发的事件名称
   * @param data (可选) 要传递给回调函数的数据
   */
  public dispatch(event: string, data?: any): void {
    // 如果没有监听器监听这个事件，直接返回
    if (!this.listeners[event]) {
      return;
    }
    // 遍历并执行所有监听该事件的回调函数
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event bus callback for event "${event}":`, error);
      }
    });
  }

  /**
   * 移除一个事件监听器
   * @param event 事件名称
   * @param callback 要移除的回调函数 (必须是注册时同一个函数实例)
   */
  public off(event: string, callback: EventCallback): void {
    // 如果没有监听器，直接返回
    if (!this.listeners[event]) {
      return;
    }
    // 从监听器数组中过滤掉要移除的那个回调函数
    this.listeners[event] = this.listeners[event].filter(
      listener => listener !== callback
    );
  }
};

// ==================== 实例导出 ====================
/**
 * 创建并导出一个 EventBus 的单例，供整个应用使用
 */
const eventBus = new EventBus();
export default eventBus;