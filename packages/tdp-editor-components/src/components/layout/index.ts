import { EnumComponentGroup, EnumComponentType } from 'tdp-editor-types/enum/components';
import { EnumCssProerty, EnumSelectorName } from 'tdp-editor-types/enum/designer';
import type {
    IDesignerComponent,
    registerComponentFunc,
} from 'tdp-editor-types/interface/designer';
import type { ILayoutProps } from './interface';
import Layout from './layoutRenderer.vue';
export default Layout;

export const register: registerComponentFunc = function () {
    const layout: IDesignerComponent<ILayoutProps> = {
        key: '',
        code: '',
        label: '卡片',
        icons: 'Cards',
        group: EnumComponentGroup.layout,
        type: EnumComponentType.layout,
        order: 100,
        listGroup: 'normal',
        showInList: false,
        propsConfigs: [{ key: 'showShadow', label: '显示阴影', selector: EnumSelectorName.switch }],
        cssConfigs: [EnumCssProerty.position, EnumCssProerty.width, EnumCssProerty.height],
    };
    return layout;
};
