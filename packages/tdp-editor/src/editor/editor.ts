/**
 * editor类库入口文件
 * 暴露createEditor方法提供给第三方调用
 */
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import type { TSelector } from 'tdp-editor-types/interface/designer/selector';
import type { IDesignerComponent } from 'tdp-editor-types/interface/designer';
// monaco配置
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import TdpEditorVue from './TdpEditor.vue';
// 自定义组件样式
import 'tdp-editor-components/src/styles/index.less';
import registerDirectives from 'tdp-editor-components/src/directives';
import usePlugin from '../plugins';
import { useEditorStore } from 'tdp-editor-utils/stores/editorStore';
import componentRegister from 'tdp-editor-components/src/utils/componentRegister';
import { EnumComponentGroup } from 'tdp-editor-types/enum/components';
import SelectorManager from '../selectors/SelectorManager';
import propSelectors from '../selectors/propSelectors';
import { createController } from 'tdp-editor-utils/controller';
import { EnumAppMode } from 'tdp-editor-types/enum';

// @ts-ignore
window.MonacoEnvironment = {
    getWorker(_: any, label: any) {
        if (label === 'json') {
            return new jsonWorker();
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
            return new cssWorker();
        }
        if (label === 'typescript' || label === 'javascript') {
            return new tsWorker();
        }
        return new editorWorker();
    },
};

interface ICreateEditorOptions {
    container: string | Element;
}

export const version = import.meta.env.VITE_APP_VERSION;
console.info('tdp editor version: ' + version);

export const createEditor = (options: ICreateEditorOptions) => {
    const pinia = createPinia();
    const app = createApp(TdpEditorVue);
    // 注册指令
    registerDirectives(app);
    // 注册插件
    usePlugin(app);
    app.use(pinia);
    const editorStore = useEditorStore();
    // 注册controller
    const controllers = createController(app);
    controllers.appController.setMode(EnumAppMode.design);
    // 注册默认组件
    const componentList = componentRegister(app);
    app.config.globalProperties.$default_componentList = componentList;
    editorStore.initComponentList({
        list: componentList,
    });
    // 注册selector
    const selectorManager = new SelectorManager(app, propSelectors);
    app.config.globalProperties.$selectorManager = selectorManager;
    // 渲染editor
    app.mount(options.container);
    return {
        editor: app,
        addCustomComponent(components: IDesignerComponent[]) {
            if (Array.isArray(components) && components.length) {
                app.config.globalProperties.$custom_componentList = components;
                components.forEach(c => {
                    if (c.group === EnumComponentGroup.custom) {
                        app.component(c.type, c.sfc!);
                    }
                });
                useEditorStore().addComponents({ list: components });
            }
        },
        addSelectors(selectors: TSelector[]) {
            selectorManager.addSelectors(selectors);
        },
    };
};
