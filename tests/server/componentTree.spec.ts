import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  parseComponentTreeContent,
  parseComponentTreeNode,
} from '../../layers/core/server/utils/componentTree'

const producerFixture = () => JSON.parse(readFileSync(resolve(
  __dirname,
  '../../contracts/stir-tools/v1/fixtures/component-tree.json',
), 'utf8'))

describe('componentTree', () => {
  it('parses the source-independent producer fixture recursively', () => {
    const fixture = producerFixture()
    const parsed = parseComponentTreeNode(fixture)

    expect(parsed).toEqual(fixture)
    expect(parsed.slots.body).toBe('<p>Rendered body text.</p>')
    expect(parsed.slots.capacity).toEqual([{
      element: 'field-value',
      props: { value: 480, valueType: 'integer' },
      slots: {},
    }])
    expect(parsed.slots.featured).toEqual([{
      element: 'field-value',
      props: { value: true, valueType: 'boolean' },
      slots: {},
    }])
    expect(parsed.slots.audience).toEqual([{
      element: 'option-value',
      props: { value: 'all_ages', label: 'All ages' },
      slots: {},
    }])
    expect(parsed.slots.section).toMatchObject([
      {
        element: 'paragraph-text',
        props: {
          text: '<p>Reusable component content.</p>',
          classes: 'lead',
          direction: 'up',
          align: 'center',
          width: 'w-lg',
          spacing: 'py-8',
        },
      },
      {
        element: 'paragraph-layout',
        props: {
          uuid: '00000000-0000-4000-8000-000000000042',
          layout: 'two_column',
          card: false,
          classes: 'feature-layout',
          container: true,
          header: 'Layout section',
          headerTag: 'h2',
          gridClass: 'lg:grid-cols-2 lg:gap-6',
        },
        slots: {
          left: [{
            element: 'paragraph-text',
            props: { text: '<p>Left region content.</p>' },
          }],
        },
      },
      {
        element: 'paragraph-icon',
        props: { iconName: 'i-lucide-star', iconSize: 7 },
      },
      {
        element: 'paragraph-enzuzo',
        props: { embedUrl: 'https://example.invalid/enzuzo.js' },
      },
      {
        element: 'paragraph-calculator',
        props: {
          embedUrl: 'https://example.invalid/calculator.js',
          venueId: 'example-venue',
        },
      },
      {
        element: 'paragraph-calendly',
        props: {
          calendlyUrl: expect.stringContaining('hide_event_type_details=1'),
          calendlyBg: '#ffffff',
          calendlyPrimary: '#0055aa',
          calendlyTextColor: '#222222',
        },
      },
      {
        element: 'paragraph-faq',
        props: {
          header: 'Frequently asked questions',
          headerTag: 'h2',
          text: '<p>Helpful booking information.</p>',
        },
        slots: {
          items: [{
            element: 'paragraph-faq-item',
            props: {
              question: 'Can I change my booking?',
              headerTag: 'h3',
              answer: '<p>Yes, contact the venue.</p>',
            },
          }],
        },
      },
      {
        element: 'paragraph-timeline',
        props: { color: 'primary' },
        slots: {
          timeline: [{
            element: 'paragraph-timeline-item',
            props: {
              date: '2026',
              header: 'vNext architecture',
              headerTag: 'h3',
              icon: 'i-lucide-rocket',
              text: '<p>Explicit component contracts introduced.</p>',
            },
          }],
        },
      },
      {
        element: 'paragraph-media',
        props: {
          direction: 'up',
          header: 'Project gallery',
          headerTag: 'h2',
          overlay: true,
          randomize: false,
        },
        slots: {
          media: [{
            element: 'media-image',
            props: {
              src: '/sites/default/files/gallery.jpg',
              alt: 'Project gallery image',
              width: 1600,
              height: 1067,
              responsiveStyle: 'container',
            },
          }],
        },
      },
      {
        element: 'paragraph-carousel',
        props: {
          header: 'Featured media',
          headerTag: 'h2',
          carouselArrows: true,
          carouselAutoheight: false,
          carouselAutoscroll: false,
          carouselFade: false,
          carouselIndicators: true,
          carouselInterval: 5000,
        },
        slots: {
          media: [{
            element: 'media-image',
            props: {
              src: '/sites/default/files/featured.jpg',
              alt: 'Featured image',
              width: 1200,
              height: 800,
              responsiveStyle: 'container',
            },
          }],
        },
      },
      {
        element: 'paragraph-hero',
        props: {
          direction: 'fade-up',
          header: 'Built for performance',
          headerTag: 'h2',
          text: '<p>A Drupal-powered Nuxt experience.</p>',
        },
        slots: {
          button: [{
            element: 'paragraph-button',
            props: {
              link: {
                title: 'Learn more',
                url: '/about',
              },
            },
          }],
          media: [{
            element: 'media-video',
            props: {
              src: '/sites/default/files/hero-poster.jpg',
              alt: 'Hero video',
              width: 1920,
              height: 1080,
              responsiveStyle: 'full',
              loading: 'eager',
              fetchpriority: 'high',
              mediaEmbed: 'https://video.example/hero.mp4',
            },
          }],
        },
      },
      {
        element: 'paragraph-button',
        props: {
          block: false,
          color: 'primary',
          icon: 'i-lucide-file-text',
          size: 'lg',
          variant: 'solid',
        },
        slots: {
          media: [{
            element: 'media-document',
            props: {
              type: 'document',
              title: 'Project brochure',
              url: '/sites/default/files/project-brochure.pdf',
              alt: 'Download the project brochure',
            },
          }],
        },
      },
      {
        element: 'paragraph-webform',
        props: {
          webform: {
            webformId: 'contact',
            webformTitle: 'Contact',
            fields: {},
            actions: [],
          },
        },
      },
      {
        element: 'paragraph-popup',
        props: {
          alert: '<p>Limited availability.</p>',
          popupDelay: 2500,
          popupOnce: true,
          popupThreshold: 0.5,
          popupTrigger: 'scroll',
          text: '<p>Request more information.</p>',
          webform: {
            webformId: 'contact',
            webformTitle: 'Contact',
            fields: {},
            actions: [],
          },
        },
        slots: {
          media: [{
            element: 'media-image',
            props: {
              src: '/sites/default/files/popup.jpg',
              alt: 'Contact our team',
              width: 1200,
              height: 800,
              responsiveStyle: 'container',
            },
          }],
        },
      },
      {
        element: 'paragraph-tabs',
        props: {},
        slots: {
          tab: [{
            element: 'paragraph-tab',
            props: {
              title: 'Overview',
              headerTag: 'h2',
            },
            slots: {
              tabContent: [{
                element: 'paragraph-text',
                props: {
                  text: '<p>Visible tab content.</p>',
                },
              }],
            },
          }],
        },
      },
    ])
    expect(parsed.slots.media).toMatchObject([{ element: 'media-image' }])
    expect(parsed.slots.level).toMatchObject([{ element: 'entity-reference' }])
  })

  it('normalizes omitted and PHP-empty props and slots', () => {
    expect(parseComponentTreeNode({ element: 'paragraph-text' })).toEqual({
      element: 'paragraph-text',
      props: {},
      slots: {},
    })
    expect(parseComponentTreeNode({
      element: 'paragraph-text',
      props: [],
      slots: [],
    })).toEqual({
      element: 'paragraph-text',
      props: {},
      slots: {},
    })
  })

  it('accepts strings and arrays as recursive slot content', () => {
    expect(parseComponentTreeContent([
      '<p>Rendered text</p>',
      { element: 'media-image' },
    ])).toEqual([
      '<p>Rendered text</p>',
      { element: 'media-image', props: {}, slots: {} },
    ])
  })

  it('rejects undocumented keys and malformed nested nodes', () => {
    expect(() => parseComponentTreeNode({
      element: 'node-page',
      props: {},
      slots: {},
      regions: {},
    })).toThrow('Invalid Drupal component tree contract at regions')

    expect(() => parseComponentTreeNode({
      element: 'node-page',
      slots: {
        section: [{ element: '', props: {}, slots: {} }],
      },
    })).toThrow('slots.section.0.element')
  })
})
