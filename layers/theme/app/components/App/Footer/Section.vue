<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

type FooterAction = {
  label?: string
  to?: string
  href?: string
  target?: string
  class?: string
  color?: string
  variant?: string
}

type FooterSiteInfo = {
  name?: string
  mail?: string
  slogan?: string
}

type FooterClasses = {
  action?: string
  actions?: string
  copyright?: string
  email?: string
  logo?: string
  menu?: string
  menuItem?: string
  menuList?: string
  poweredBy?: string
  slogan?: string
  socialIcon?: string
  socials?: string
}

const props = defineProps<{
  actions?: FooterAction[]
  atoms: string[]
  classes?: FooterClasses
  currentYear: number
  footerLinks?: string
  hideEmail?: boolean
  menuItems?: NavigationMenuItem[]
  rights?: string
  show?: Record<string, boolean>
  siteInfo?: FooterSiteInfo
  socialIcons?: Record<string, unknown>[]
}>()

const shouldShow = (atom: string) => props.show?.[atom] !== false
</script>

<template>
  <template
    v-for="atom in atoms"
    :key="atom"
  >
    <slot
      :name="atom"
      v-bind="{ classes, currentYear, footerLinks, menuItems, rights, siteInfo, socialIcons }"
    >
      <LazyAppLogo
        v-if="atom === 'logo' && shouldShow(atom)"
        :add-classes="classes?.logo"
      />

      <LazyUNavigationMenu
        v-else-if="atom === 'menu' && shouldShow(atom) && menuItems?.length"
        aria-label="Footer Navigation"
        :class="classes?.menu"
        :items="menuItems"
        :ui="{
          list: classes?.menuList,
          item: classes?.menuItem,
          link: footerLinks,
        }"
        variant="link"
      />

      <div
        v-else-if="atom === 'actions' && shouldShow(atom) && actions?.length"
        :class="classes?.actions"
      >
        <UButton
          v-for="(action, index) in actions"
          :key="action.to || action.href || action.label || index"
          :class="[classes?.action, action.class]"
          :color="action.color as never"
          :target="action.target"
          :to="action.to || action.href"
          :variant="action.variant as never"
        >
          {{ action.label }}
        </UButton>
      </div>

      <div
        v-else-if="atom === 'socials' && shouldShow(atom) && socialIcons?.length"
        :class="classes?.socials"
      >
        <LazyIconsSocial
          v-for="(icon, index) in socialIcons"
          :key="String(icon.url || icon.title || index)"
          v-bind="icon"
          :class="classes?.socialIcon"
        />
      </div>

      <p
        v-else-if="atom === 'slogan' && shouldShow(atom) && siteInfo?.slogan"
        :class="classes?.slogan"
      >
        {{ siteInfo.slogan }}
      </p>

      <ULink
        v-else-if="atom === 'email' && shouldShow(atom) && !hideEmail && siteInfo?.mail"
        :class="classes?.email"
        :inactive-class="footerLinks"
        raw
        target="_blank"
        :to="`mailto:${siteInfo.mail}`"
      >
        {{ siteInfo.mail }}
      </ULink>

      <p
        v-else-if="atom === 'legal' && (shouldShow('copyright') || shouldShow('poweredBy')) && siteInfo?.name"
        :class="classes?.copyright"
      >
        <template v-if="shouldShow('copyright')">
          © {{ siteInfo.name }} {{ currentYear }}. All Rights Reserved.<br />
          <template v-if="rights">
            {{ rights }}<br />
          </template>
        </template>
        <template v-if="shouldShow('poweredBy')">
          Website created & powered by
          <ULink
            :inactive-class="footerLinks"
            raw
            target="_blank"
            to="https://www.stirstudiosdesign.com"
          >
            StirStudios
          </ULink>
        </template>
      </p>

      <p
        v-else-if="atom === 'copyright' && shouldShow(atom) && siteInfo?.name"
        :class="classes?.copyright"
      >
        © {{ siteInfo.name }} {{ currentYear }}. All Rights Reserved.<br />
        <template v-if="rights">
          {{ rights }}<br />
        </template>
      </p>

      <p
        v-else-if="atom === 'poweredBy' && shouldShow(atom)"
        :class="classes?.poweredBy"
      >
        Website created & powered by
        <ULink
          :inactive-class="footerLinks"
          raw
          target="_blank"
          to="https://www.stirstudiosdesign.com"
        >
          StirStudios
        </ULink>
      </p>
    </slot>
  </template>
</template>
