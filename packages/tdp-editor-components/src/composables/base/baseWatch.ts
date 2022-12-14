import { watchEffect } from 'vue';
import { EnumAppMode } from 'tdp-editor-types/enum';
import type { ISetupBaseProps } from 'tdp-editor-types/interface/components';
import { utils } from 'tdp-editor-utils';
import useInject from './baseInject';

export default function useBaseWatch(props: ISetupBaseProps) {
    const { getAppMode } = useInject();
    if (getAppMode() === EnumAppMode.design) {
        /*
        watch(
            reactive(props.state),
            newState => {
                // 监听styleText，用户自定义样式字段
                if (newState.styleText) {
                    utils.$createDynamicStyle(props.state.key, newState.styleText);
                }
            }
            // reactive 默认开启immediate
            // {
            //     immediate: true,
            // }
        );
        */
        watchEffect(() => {
            if (props.state.styleText) {
                utils.$createDynamicStyle(props.state.key, props.state.styleText);
            }
        });
    }
}
