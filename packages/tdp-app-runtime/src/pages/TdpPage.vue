<template>
    <div
        :class="{
            'tdp-editor-runtime-wrapper': true,
        }"
    >
        <RuntimePage v-if="pageJson" :json="pageJson" :appMode="EnumAppMode.runtime"></RuntimePage>
    </div>
</template>
<style lang="less">
@blueColor: #1890ff;
</style>
<script lang="ts" setup>
import { onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { EnumAppMode } from 'tdp-editor-types/enum';
import RuntimePage from 'tdp-editor-components/src/page.vue';
import { useAppControler } from 'tdp-editor-utils/controller';
const props = defineProps<{
    pageId?: string;
}>();
const router = useRouter();
const currentPageId = computed(() => {
    return props.pageId || '';
});
onMounted(() => {
    console.info(`tdp-app-page ${currentPageId.value} onMounted`);
});
watch(
    () => props.pageId,
    (newPageId, oldPageId) => {
        if (newPageId !== oldPageId) {
            console.info('应该要切换页面数据了', oldPageId, currentPageId.value);
            // 1.检查有没有页面缓存数据，有的话直接切换到缓存数据
            // 2.没有的话，发送接口，请求当前页面得数据，并缓存
        }
    }
);
const appController = useAppControler();
// 监听当前页面数据切换
const pageJson = computed(() => {
    return appController.getActivePage();
});

setTimeout(() => {
    router.push('dddd');
}, 3000);
</script>
