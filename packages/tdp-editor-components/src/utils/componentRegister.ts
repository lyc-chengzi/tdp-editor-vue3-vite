import type { App } from 'vue';
import type { IDesignerComponent } from 'tdp-editor-types/interface/designer';
// 遍历所有组件信息
const components = import.meta.globEager('../components/*/index.(ts|tsx)');
/**
 * 自动注册组件
 * @returns 返回组件列表
 */
const register = (app: App): IDesignerComponent[] => {
    const componentList: IDesignerComponent[] = [];
    Object.keys(components).map(module => {
        const componentFile = components[module];
        const register = componentFile.register;
        if (register) {
            const $register = register();
            const isMultiple = $register instanceof Array;
            let registers = [];
            if (isMultiple) {
                registers = $register;
            } else {
                registers = [$register];
            }
            registers.forEach((c: any) => {
                app.component(c.type, isMultiple ? componentFile[c.type] : componentFile.default);
                if (c.showInList !== false) {
                    componentList.push(c);
                }
            });
        }
    });
    const result = componentList.sort((a, b) => (a.order || 0) - (b.order || 0));
    return result;
};

export default register;
