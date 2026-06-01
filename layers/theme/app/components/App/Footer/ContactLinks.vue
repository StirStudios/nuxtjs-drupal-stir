<script setup lang="ts">
const { getPage } = useDrupalCe()
const page = getPage()
const theme = useAppConfig().stirTheme
const { iconsSocialConfig } = useSocialIcons()

const rootClass = computed(() => theme.footer.contactLinks || 'social mt-10')
const showEmail = computed(() => theme.footer.showEmail !== false && !theme.footer.hideEmail)
const socialsClass = computed(() => theme.footer.socials || 'flex gap-1')
const socialIconClass = computed(() => theme.footer.socialIcon || 'me-1')
const emailClass = computed(() => theme.footer.contactEmail || 'mt-3 inline-block')
</script>

<template>
  <div :class="rootClass">
    <div :class="socialsClass">
      <LazyIconsSocial
        v-for="(icon, index) in iconsSocialConfig"
        :key="icon.url || icon.title || index"
        v-bind="icon"
        :class="socialIconClass"
      />
    </div>

    <ULink
      v-if="showEmail && page?.site_info?.mail"
      :class="emailClass"
      :inactive-class="theme.footer.footerLinks"
      raw
      rel="noopener"
      target="_blank"
      :to="`mailto:${page.site_info.mail}`"
    >
      {{ page.site_info.mail }}
    </ULink>
  </div>
</template>
