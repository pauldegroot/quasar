import Vue from 'vue'

import AnchorMixin from '../../mixins/anchor.js'
import ModelToggleMixin from '../../mixins/model-toggle.js'
import PortalMixin from '../../mixins/portal.js'
import TransitionMixin from '../../mixins/transition.js'

import { getScrollTarget } from '../../utils/scroll.js'
import { listenOpts } from '../../utils/event.js'
import slot from '../../utils/slot.js'
import {
  validatePosition, validateOffset, setPosition, parsePosition
} from '../../utils/position-engine.js'

export default Vue.extend({
  name: 'QTooltip',

  mixins: [ AnchorMixin, ModelToggleMixin, PortalMixin, TransitionMixin ],

  props: {
    maxHeight: {
      type: String,
      default: null
    },
    maxWidth: {
      type: String,
      default: null
    },

    transitionShow: {
      default: 'jump-down'
    },
    transitionHide: {
      default: 'jump-up'
    },

    anchor: {
      type: String,
      default: 'bottom middle',
      validator: validatePosition
    },
    self: {
      type: String,
      default: 'top middle',
      validator: validatePosition
    },
    offset: {
      type: Array,
      default: () => [14, 14],
      validator: validateOffset
    },

    delay: {
      type: Number,
      default: 0
    }
  },

  computed: {
    anchorOrigin () {
      return parsePosition(this.anchor)
    },

    selfOrigin () {
      return parsePosition(this.self)
    },

    navigationHideCondition () {
      return this.persistent !== true
    }
  },

  methods: {
    __show (evt) {
      clearTimeout(this.timer)

      this.__showPortal()

      this.timer = setTimeout(() => {
        this.updatePosition()

        this.timer = setTimeout(() => {
          this.$emit('show', evt)
          this.__configureScrollTarget()
        }, 300)
      }, 0)
    },

    __hide (evt) {
      this.__anchorCleanup()

      this.timer = setTimeout(() => {
        this.__hidePortal()
        this.$emit('hide', evt)
      }, 300)
    },

    __anchorCleanup () {
      clearTimeout(this.timer)
      this.__unconfigureScrollTarget()
    },

    updatePosition () {
      const el = this.__portal.$el

      if (el.nodeType === 8) { // IE replaces the comment with delay
        setTimeout(() => {
          this.__portal !== void 0 && this.__portal.showing === true && this.updatePosition()
        }, 25)
        return
      }

      if (this.anchorEl === void 0) { return }

      setPosition({
        el,
        offset: this.offset,
        anchorEl: this.anchorEl,
        anchorOrigin: this.anchorOrigin,
        selfOrigin: this.selfOrigin,
        maxHeight: this.maxHeight,
        maxWidth: this.maxWidth
      })
    },

    __delayShow (evt) {
      clearTimeout(this.timer)
      this.$q.platform.is.mobile === true && document.body.classList.add('non-selectable')
      this.timer = setTimeout(() => {
        this.show(evt)
      }, this.delay)
    },

    __delayHide (evt) {
      clearTimeout(this.timer)
      this.$q.platform.is.mobile === true && document.body.classList.remove('non-selectable')
      this.hide(evt)
    },

    __unconfigureAnchorEl () {
      // mobile hover ref https://stackoverflow.com/a/22444532
      if (this.$q.platform.is.mobile) {
        this.anchorEl.removeEventListener('touchstart', this.__delayShow)
        ;['touchcancel', 'touchmove', 'click'].forEach(evt => {
          this.anchorEl.removeEventListener(evt, this.__delayHide)
        })
      }
      else {
        this.anchorEl.removeEventListener('mouseenter', this.__delayShow)
      }

      if (this.$q.platform.is.ios !== true) {
        this.anchorEl.removeEventListener('mouseleave', this.__delayHide)
      }
    },

    __configureAnchorEl () {
      if (this.noParentEvent === true) { return }

      // mobile hover ref https://stackoverflow.com/a/22444532
      if (this.$q.platform.is.mobile) {
        this.anchorEl.addEventListener('touchstart', this.__delayShow)
        ;['touchcancel', 'touchmove', 'click'].forEach(evt => {
          this.anchorEl.addEventListener(evt, this.__delayHide)
        })
      }
      else {
        this.anchorEl.addEventListener('mouseenter', this.__delayShow)
      }

      if (this.$q.platform.is.ios !== true) {
        this.anchorEl.addEventListener('mouseleave', this.__delayHide)
      }
    },

    __unconfigureScrollTarget () {
      if (this.scrollTarget !== void 0) {
        this.scrollTarget.removeEventListener('scroll', this.updatePosition, listenOpts.passive)
        window.removeEventListener('scroll', this.updatePosition, listenOpts.passive)
        this.scrollTarget = void 0
      }
    },

    __configureScrollTarget () {
      if (this.anchorEl !== void 0) {
        this.scrollTarget = getScrollTarget(this.anchorEl)
        if (this.noParentEvent !== true) {
          this.scrollTarget.addEventListener('scroll', this.hide, listenOpts.passive)
        }
        if (this.noParentEvent === true || this.scrollTarget !== window) {
          window.addEventListener('scroll', this.updatePosition, listenOpts.passive)
        }
      }
    },

    __render (h) {
      return h('transition', {
        props: { name: this.transition }
      }, [
        this.showing === true ? h('div', {
          staticClass: 'q-tooltip no-pointer-events',
          class: this.contentClass,
          style: this.contentStyle,
          attrs: {
            role: 'complementary'
          }
        }, slot(this, 'default')) : null
      ])
    }
  }
})
