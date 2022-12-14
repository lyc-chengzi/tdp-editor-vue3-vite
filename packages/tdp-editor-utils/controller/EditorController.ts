/**
 * EditorController 封装editor的逻辑
 * 需要同时访问editorStore和appStore的较复杂的逻辑方法放到此类中
 */
import type { IDesignerComponent } from 'tdp-editor-types/interface/designer';
import type { App } from 'vue';
import type { IAppSaveStruct } from 'tdp-editor-types/interface/app';
import type { IPageStoreState } from 'tdp-editor-types/interface/store';

import { EnumComponentType } from 'tdp-editor-types/enum/components';
import { useEditorStore } from '../stores/editorStore';
import { useAppStore } from '../stores/appStore';
import { EnumAppEnv } from 'tdp-editor-types/enum';
import { openDBAsync, setDataAsync, getDataAsync } from '../indexDBUtil';
import { useAppControler } from './index';
import { utils } from '../index';
export default class EditorController {
    private readonly $app: App;
    constructor(app: App) {
        this.$app = app;
    }
    addCustomerComponents(list: IDesignerComponent[]) {
        const $editorStore = useEditorStore();
        $editorStore.addComponents({ list });
    }
    initComponentList(list: IDesignerComponent[]) {
        const $editorStore = useEditorStore();
        $editorStore.initComponentList({ list });
    }
    /**
     * 初始化editor数据
     */
    async initEditorAsync() {
        const db = await openDBAsync().catch();
        // 如果有本地数据，则使用本地数据渲染，如果没有，则初始化一个空的editor
        const localData = await getDataAsync(db, 'local').catch();
        if (localData) {
            this.initEditorByLocalData(localData.data);
        } else {
            this.initEditorByEmpty();
        }
    }
    /**
     * 使用本地数据初始化editor数据
     */
    initEditorByLocalData(localData: IAppSaveStruct) {
        const appStore = useAppStore();
        appStore.pages = localData.pages.map(p => {
            return {
                ...p,
                submitState: 'saved',
                selected: false,
            } as IPageStoreState;
        });
        appStore.activePage = appStore.pages.find(c => c.key === localData.defaultPageKey);
        if (appStore.activePage) {
            appStore.activePage.selected = true;
        }
    }
    /**
     * 初始化一个空的editor的数据
     */
    initEditorByEmpty() {
        const appStore = useAppStore();
        const editorStore = useEditorStore();
        const newPage = editorStore.createNewEmptyPage(appStore.pages);
        newPage.selected = true;
        appStore.pages.push(newPage);
        appStore.activePage = newPage;
    }
    /**
     * 获取预览地址
     * @param env 运行环境
     * @returns 返回预览地址
     */
    getPreviewUrl(env: EnumAppEnv) {
        const appStore = useAppStore();
        const pageKey = appStore.activePage?.key || '';
        if (env === EnumAppEnv.local || env === EnumAppEnv.dev) {
            return `http://localhost:3031/preview/app/pages/${pageKey}`;
        }
    }
    /**
     * 保存editor的数据到本地
     */
    async saveLocalData() {
        const appController = useAppControler();
        const db = await openDBAsync().catch();
        const data = {
            id: 'local',
            data: appController.getSaveData(),
        };
        await setDataAsync(db, data).catch();
    }
    // 导入配置文件
    importConfig(payload: { pages: IPageStoreState[] }) {
        const appStore = useAppStore();
        appStore.pages = payload.pages;
        if (appStore.pages && appStore.pages.length) {
            appStore.activePage = appStore.pages[0];
        }
    }
    // 添加页面
    addPage(payload?: { page?: IPageStoreState }) {
        const appStore = useAppStore();
        const editorStore = useEditorStore();
        if (payload && payload.page) {
            const newPage = editorStore.createNewEmptyPage(appStore.pages);
            const _page = { ...newPage, ...payload.page };
            appStore.pages.push(_page);
        } else {
            const newPage = editorStore.createNewEmptyPage(appStore.pages);
            appStore.pages.push(newPage);
        }
    }
    // 删除页面
    deletePage(payload: { pageKey: string }) {
        const appStore = useAppStore();
        const index = appStore.pages.findIndex(p => p.key === payload.pageKey);
        if (index > -1) {
            appStore.pages.splice(index, 1);
        }
    }
    initAppPages(payload: { pages: IPageStoreState[] }) {
        const appStore = useAppStore();
        appStore.pages = payload.pages;
        if (payload.pages.length) {
            appStore.activePage = payload.pages[0];
        }
    }
    // 删除选中的组件
    deleteComponent(payload: { id: string }) {
        const componentId = payload.id;
        const appStore = useAppStore();
        const editorStore = useEditorStore();
        const activePage = appStore.activePage;
        if (activePage && activePage.list) {
            // 从当前页面组件列表中查找要删除的组件
            utils.$deleteTreeItem(activePage.list, componentId);
            editorStore.selectedComponent = undefined;
        }
    }
    // 导入csv文件的组件
    importCsvData(payload: { pageName: string; pageCode: string; data: any }) {
        const appStore = useAppStore();
        const editorStore = useEditorStore();
        const newPage = {
            ...editorStore.createNewEmptyPage(appStore.pages),
            ...{ label: payload.pageName, code: payload.pageCode },
        };
        const rowState = editorStore.componentList.find(c => c.type === EnumComponentType.row);
        if (rowState) {
            // 创建行
            const rowKey = utils.$getUUID(EnumComponentType.row);
            const newRow: IDesignerComponent = {
                key: rowKey,
                code: '',
                label: rowState.label,
                icons: rowState.icons,
                group: rowState.group,
                type: rowState.type,
                list: [],
            };
            for (const k in payload.data) {
                const type = payload.data[k];
                const component = editorStore.componentList.find(c => c.type === type);
                if (component) {
                    newRow.list!.push({
                        key: utils.$getUUID(component.type),
                        code: '',
                        group: component.group,
                        type: component.type,
                        label: component.label,
                        icons: component.icons,
                        props: {
                            label: k,
                            dense: true,
                        },
                    } as any);
                }
            }
            if (newPage.list && newPage.list.length) {
                newPage.list[0].list!.push(newRow);
                appStore.pages.push(newPage);
                return newPage.key;
            }
        }
        return '';
    }
    // 导入csv文件数据
    importCsvDataAsync(payload: { pageName: string; pageCode: string; data: any }) {
        this.importCsvData(payload);
        const appStore = useAppStore();
        appStore.setActivePage({
            pageId: appStore.pages[appStore.pages.length - 1].key,
        });
    }
}
