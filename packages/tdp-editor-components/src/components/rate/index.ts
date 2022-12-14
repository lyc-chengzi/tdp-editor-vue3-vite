import { EnumSelectorName } from 'tdp-editor-types/enum/designer';
import type { ISelectorSliderOptions } from 'tdp-editor-types/interface/designer/selector';
import {
    EnumComponentGroup,
    EnumComponentType,
    EnumPropsValueType,
} from 'tdp-editor-types/enum/components';
import type {
    IDesignerComponent,
    registerComponentFunc,
} from 'tdp-editor-types/interface/designer';
import type { IRateProps } from './interface';
import Rate from './rateRenderer.vue';
export default Rate;

export const register: registerComponentFunc = function () {
    const rate: IDesignerComponent<IRateProps> = {
        key: '',
        code: '',
        label: '评分',
        icons: 'Ratings',
        group: EnumComponentGroup.form,
        type: EnumComponentType.rate,
        isFormer: true,
        listGroup: 'business',
        order: 307,
        getDefaultProps: () => {
            return {
                label: {
                    type: EnumPropsValueType.string,
                    value: '',
                },
                defaultValue: {
                    type: EnumPropsValueType.number,
                    value: 3,
                },
            };
        },
        propsConfigs: [
            {
                key: 'count',
                label: 'star总数',
                selector: {
                    name: EnumSelectorName.slider,
                    options: {
                        max: 5,
                        min: 1,
                    } as ISelectorSliderOptions,
                },
            },
        ],
    };
    return rate;
};
