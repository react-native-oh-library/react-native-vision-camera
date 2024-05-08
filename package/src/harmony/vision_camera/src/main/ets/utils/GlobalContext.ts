export class GlobalContext {
  private constructor() {
  }

  private static instance: GlobalContext;
  private objects = new Map<string, Object>();

  public static getContext(): GlobalContext {
    if (!GlobalContext.instance) {
      GlobalContext.instance = new GlobalContext();
    }
    return GlobalContext.instance;
  }

  getValue(value: string): Object {
    let result = this.objects.get(value);
    if (!result) {
      return result;
    }
  }

  setValue(key: string, objectClass: Object): void {
    this.objects.set(key, objectClass);
  }
}