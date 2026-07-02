<script setup lang="ts">
import type { SocialIcon } from '~/types'
import type { AppContextSiteInfo } from '~/composables/useAppContext'

const STIR_STUDIOS_WEBSITE = 'https://www.stirstudiosdesign.com'

type FooterAtom =
  | 'logo'
  | 'menu'
  | 'socials'
  | 'slogan'
  | 'email'
  | 'legal'
  | 'copyright'
  | 'poweredBy'

type FooterConfig = {
  logo: string
  logoFromTheme: string
  menu: string
  menuItem: string
  menuList: string
  socials: string
  socialIcon: string
  slogan: string
  email: string
  copyright: string
  poweredBy: string
  rights: string
  footerLinks: string
}

defineProps<{
  atoms: FooterAtom[]
  config: FooterConfig
  menuItems: { label: string; to: string }[]
  siteInfo?: AppContextSiteInfo
  socialIcons: SocialIcon[]
  showLogo: boolean
  showCopyright: boolean
  showPoweredBy: boolean
  toMail?: string
  year: number
}>()
</script>

<template>
  <template v-for="atom in atoms" :key="atom">
    <template v-if="atom === 'logo'">
      <LazyAppLogo
        v-if="showLogo"
        :add-classes="config.logo || config.logoFromTheme"
      />
      <span v-else>
        {{ siteInfo?.name }}
      </span>
    </template>

    <LazyUNavigationMenu
      v-else-if="atom === 'menu' && menuItems.length"
      aria-label="Footer Navigation"
      :class="config.menu"
      :items="menuItems"
      :ui="{
        list: config.menuList,
        item: config.menuItem,
        link: config.footerLinks,
      }"
      variant="link"
    />

    <div
      v-else-if="atom === 'socials'"
      :class="config.socials"
    >
      <LazyIconsSocial
        v-for="(icon, index) in socialIcons"
        :key="String(icon.url || icon.title || index)"
        v-bind="icon"
        :class="config.socialIcon"
      />
    </div>

    <p
      v-else-if="atom === 'slogan'"
      :class="config.slogan"
    >
      {{ siteInfo?.slogan }}
    </p>

    <ULink
      v-else-if="atom === 'email' && toMail"
      :class="config.email"
      :inactive-class="config.footerLinks"
      raw
      target="_blank"
      :to="toMail"
    >
      {{ siteInfo?.mail }}
    </ULink>

    <p
      v-else-if="atom === 'legal'"
      :class="config.copyright"
    >
      <template v-if="showCopyright && siteInfo?.name">
        © {{ siteInfo.name }} {{ year }}. All Rights Reserved.
        <template v-if="config.rights">
          <br>
          {{ config.rights }}
        </template>
        <template v-if="showPoweredBy">
          <br>
        </template>
      </template>
      <template v-if="showPoweredBy">
        Website created &amp; powered by
        <ULink
            :inactive-class="config.footerLinks"
            raw
            target="_blank"
            :to="STIR_STUDIOS_WEBSITE"
        >
          StirStudios
        </ULink>
      </template>
    </p>

    <p
      v-else-if="atom === 'copyright'"
      :class="config.copyright"
    >
      © {{ siteInfo?.name }} {{ year }}. All Rights Reserved.
      <template v-if="config.rights">
        <br>
        {{ config.rights }}
      </template>
    </p>

    <p
      v-else-if="atom === 'poweredBy'"
      :class="config.poweredBy"
    >
      Website created &amp; powered by
      <ULink
        :inactive-class="config.footerLinks"
        raw
        target="_blank"
        :to="STIR_STUDIOS_WEBSITE"
      >
        StirStudios
      </ULink>
    </p>
  </template>
</template>
