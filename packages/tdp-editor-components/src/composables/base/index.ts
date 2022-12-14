import { computed, getCurrentInstance } from 'vue';
import type { EnumApiType, EnumEventType } from 'tdp-editor-types/enum/components';
import type { ISetupBaseProps } from 'tdp-editor-types/interface/components';
import { apiFactory, eventFactory, propsFactory, request } from 'tdp-editor-utils';
import type { IServiceResult } from 'tdp-editor-types/interface/request';
import apiDomain from 'tdp-editor-utils/service/apiDomain';
import { EnumAppMode } from 'tdp-editor-types/enum';
import useBaseInject from './baseInject';

export { default as useBaseWatch } from './baseWatch';
export { default as useBaseInject } from './baseInject';
export { default as useBaseLifecycle } from './baseLifecycle';

function useBaseIndex(props: ISetupBaseProps) {
    const injects = useBaseInject();
    // 用于express表达式中的变量
    const { pageData, pageMethods } = injects;

    // // 生命周期
    // useBaseLifecycle(props);
    // // 添加watch
    // useBaseWatch(props);
    // 处理后的css
    const c_Css = computed<Record<string, string>>(() => {
        return {
            ...{
                margin: 'auto',
                padding: 'auto',
            },
            ...props.state.css,
        };
    });

    // 处理后的组件属性
    const c_Props = computed<any>(() => {
        return propsFactory.formatProps(props.state.props!, getExpression, getFunction);
    });

    // 是否设计模式
    const c_isDesignMode = computed<boolean>(() => {
        return injects.getAppMode() === EnumAppMode.design;
    });

    const c_value = computed({
        get(): string | null {
            return propsFactory.getPropsValue(props.state, 'value') || null;
        },
        set(value: any): void {
            propsFactory.setPropsValue(props.state, 'value', value);
        },
    });

    const c_Events = {};

    const getExpression = (expression: string) => {
        let result: any = undefined;
        try {
            result = eval(expression);
        } catch {
            //console.error(e);
            result = null;
        }
        return result;
    };
    const getFunction = (functionName: string) => {
        const $function = pageMethods[functionName];
        let result: any = new Function();
        if ($function) {
            result = $function();
        }
        return result;
    };
    // 获取事件处理函数
    const getEventHandlers = (eventType: EnumEventType) => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const emptyFunc = () => {};
        const events = eventFactory.getEventsByType(props.state, eventType);
        if (events.length) {
            // 组装事件处理函数
            return function ($event: Event) {
                // 组装执行函数
                const functions = events.map(event => {
                    if (event.funcName) {
                        return getFunction(event.funcName);
                    } else {
                        return new Function('$event', '$state', event.funcStr).bind(
                            getCurrentInstance()
                        );
                    }
                });
                functions.forEach(func => {
                    func($event, props.state);
                });
            };
        } else return emptyFunc;
    };
    // 根据key返回包装的component对象，一般提供给代码编辑器使用
    const getComponent = (key: string) => {
        return injects.getComponentByKey(key);
    };
    // 触发指定的api
    async function triggerApi(params: {
        name?: string;
        apiType?: EnumApiType;
    }): Promise<IServiceResult | null> {
        let res: IServiceResult | null = null;
        if (params.name) {
            const api = apiFactory.getApiValueByName(props.state, params.name);
            if (api) {
                res = await request.$fetch({
                    url: `${apiDomain.domain}${api.path}`,
                    method: api.method,
                });
            }
        } else if (params.apiType) {
            const apiArray = apiFactory.getApiValueByType(props.state, params.apiType);
            if (apiArray.length) {
                const api = apiArray[0];
                res = await request.$fetch({
                    url: `${apiDomain.domain}${api.path}`,
                    method: api.method,
                });
            }
        }
        return res;
    }

    return {
        // methods
        getComponent,
        triggerApi,
        getEventHandlers,
        getFunction,
        getExpression,

        // inject
        ...injects,
        pageData,
        pageMethods,

        // 计算属性
        c_Css,
        c_Props,
        c_isDesignMode,
        c_value,
        c_Events,
    };
}

export const useBase = useBaseIndex;
