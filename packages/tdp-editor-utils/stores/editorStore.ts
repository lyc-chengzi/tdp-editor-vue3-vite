/**
 * editorStore editor全局状态
 * 只处理editor state的相关方法，如果需要处理其他store中的数据，则要将方法放到对应的EditorController中
 */
import { defineStore } from 'pinia';
import {
    EnumComponentType,
    EnumComponentGroup,
    EnumPropsValueType,
} from 'tdp-editor-types/enum/components';

import type { IPageStoreState, IEditorStoreState } from 'tdp-editor-types/interface/store';
import type { IDesignerComponent } from 'tdp-editor-types/interface/designer';

import { utils } from '../';
import { apps, forms } from '../service';
import { EnumServiceResultStatus } from 'tdp-editor-types/enum/request';
// import { useAppStore } from './appStore';

export const useEditorStore = defineStore('editorStore', {
    state: (): IEditorStoreState => {
        return {
            selectedComponent: undefined,
            componentList: [],
            dragComponent: undefined, // 正在拖动的组件
        };
    },
    actions: {
        // 初始化editor的组件列表
        initComponentList(payload: { list: IDesignerComponent[] }) {
            this.componentList = payload.list;
        },
        // 追加一批组件
        addComponents(payload: { list: IDesignerComponent[] }) {
            payload.list.forEach(l => {
                if (!this.componentList.some(c => c.type === l.type)) {
                    this.componentList.push(l);
                }
            });
        },
        // 在editor中创建一个空的页面
        createNewEmptyPage(pages: IPageStoreState[]) {
            return getDefaultPageModule(pages, this.componentList);
        },
        // 设计面板拖入组件
        dragAddComponent(payload: { parent: IDesignerComponent; component: IDesignerComponent }) {
            if (payload.parent) {
                this.selectedComponent = payload.component;
            }
        },
        // 双击添加组件
        doubleAddComponent(payload: { parent: IDesignerComponent; component: IDesignerComponent }) {
            if (payload.parent && payload.component) {
                // 父组件是页面，并且要添加的组件是容器组件时，才可以正常添加
                if (
                    payload.parent.type === EnumComponentType.page &&
                    payload.component.group === EnumComponentGroup.layout
                ) {
                    payload.parent.list?.push(payload.component);
                }
                // 不是页面时，需要父组件是容器组件才能添加
                else if (
                    payload.parent.type !== EnumComponentType.page &&
                    [
                        EnumComponentType.layout,
                        EnumComponentType.form,
                        EnumComponentType.row,
                        EnumComponentType.col,
                    ].some(type => type === payload.parent.type)
                ) {
                    payload.parent.list?.push(payload.component);
                    // state.selectedComponent = payload.component;
                }
            }
        },
        // 设置选中的拖动组件
        setDragComponent(payload: { component: IDesignerComponent }) {
            this.dragComponent = payload.component;
        },
        // 设置当前选中的组件
        setSelectedComponent(payload: { component: IDesignerComponent | undefined }) {
            this.selectedComponent = payload.component;
        },
        // 保存页面json数据
        async savePage(payload: { appId: string; projectId: string; app: any }) {
            return apps.appService.updateApp(payload.appId, payload.projectId, payload.app);
        },
        // 保存form数据结构
        async saveForm(payload: { form: any }) {
            return forms.formService.addForm(payload.form);
        },
        async save(payload: { appId: string; projectId: string; app: any; form: any }) {
            return new Promise((ok, fail) => {
                Promise.all([
                    this.savePage({
                        appId: payload.appId,
                        projectId: payload.projectId,
                        app: payload.app,
                    }),
                    this.saveForm({ form: payload.form }),
                ])
                    .then(resAll => {
                        if (
                            resAll.length === 2 &&
                            resAll[0].status === EnumServiceResultStatus.success &&
                            resAll[1].status === EnumServiceResultStatus.success
                        ) {
                            ok('');
                        } else {
                            fail('save fail');
                        }
                    })
                    .catch(() => {
                        fail('save fail');
                    });
            });
        },
    },
});

// 生成一个默认的page配置
const getDefaultPageModule = (
    pages: IPageStoreState[],
    componentList: IDesignerComponent[]
): IPageStoreState => {
    const newPage: IPageStoreState = {
        key: utils.$getUUID(EnumComponentType.page),
        code: '',
        label: '表单' + (pages.length + 1),
        icons: 'flex',
        type: EnumComponentType.page,
        group: EnumComponentGroup.page,
        selected: false,
        submitState: 'unsaved',
        props: {
            pageData: {
                type: EnumPropsValueType.object,
                value: {
                    text: 'testExpression',
                },
            },
            pageMethods: {
                type: EnumPropsValueType.object,
                value: {
                    setText: `this.pageData.text = new Date().toLocaleTimeString();`,
                },
            },
        },
        list: [],
    };
    // const formState = state.componentList.find(c => c.type === EnumComponentType.form);
    // if (formState) {
    //     const formKey = utils.$getUUID(EnumComponentType.form);
    //     const newForm: IDesignerComponent = {
    //         key: formKey,
    //         code: '',
    //         label: formState.label,
    //         icon: formState.icon,
    //         group: formState.group,
    //         type: formState.type,
    //         list: [],
    //     };
    //     newPage.list!.push(newForm);
    // }
    const layoutState = componentList.find(c => c.type === EnumComponentType.layout);
    if (layoutState) {
        const Key = utils.$getUUID(EnumComponentType.layout);
        const newForm: IDesignerComponent = {
            key: Key,
            code: '',
            label: layoutState.label,
            icons: layoutState.icons,
            group: layoutState.group,
            type: layoutState.type,
            list: [],
        };
        newPage.list!.push(newForm);
    }
    return newPage;
};
