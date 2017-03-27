import './Window';
import { DOMElement } from './DOMElement';
import { DOMUtils } from './DOMUtils';

interface SwiperEvents {
  click: string;
  down: string;
  move: string;
  up: string;
}

interface SwiperOptions {
  animationMs: number;
  nextCtrlClasses: string[];
  prevCtrlClasses: string[];
  showControls: boolean;
}

class Swiper {
  static readonly ACTIVE_EVENT: string = 'click';
  static readonly THUMBNAILS_CONTAINER_CLASS: string = 'thumbnails-container';
  static readonly THUMBNAIL_ITEM_CLASS: string = 'thumbnail-item';
  static readonly ITEM_MAGNIFY_WIDTH: string = '100%';
  static readonly SWIPER_CLASS: string = 'swiper-section';
  static readonly CONTAINER_CLASS: string = 'swiper-container';
  static readonly ITEM_CLASS: string = 'swiper-item';
  static readonly ACTIVE_CTRL_CLASS: string = 'active';
  static readonly ACTIVE_EVENT_CTRL: string = 'click';
  static readonly SWIPE_OUT_RANGE: number = 35;
  static readonly SWIPE_PERCENT_AJUST: number = 10;
  static readonly WINDOW_EVENT: string = 'resize';
  static readonly TOUCH_EVENTS: SwiperEvents = {
    click: 'touchend',
    down: 'touchstart',
    move: 'touchmove',
    up: 'touchend'
  };
  static readonly MOUSE_EVENTS: SwiperEvents = {
    click: 'click',
    down: 'mousedown',
    move: 'mousemove',
    up: 'mouseup'
  };

  public container: HTMLElement;
  public firstPointX: number;
  public firstPointY: number;
  public index: number;
  public initDistance: number;
  public traveledDistance: number;
  public items: NodeListOf<Element>;
  public nextCtrl: DOMElement;
  public prevCtrl: DOMElement;
  public swiper: HTMLElement;
  public supportEvents: SwiperEvents;
  public thumbnails: NodeListOf<Element>;
  public options: SwiperOptions;

  constructor(swiper: Element, options: SwiperOptions) {
    this.actionDown = this.actionDown.bind(this);
    this.actionUp = this.actionUp.bind(this);
    this.activateSwipe = this.activateSwipe.bind(this);
    this.animate = this.animate.bind(this);
    this.showByIndex = this.showByIndex.bind(this);
    this.showPrev = this.showPrev.bind(this);
    this.showNext = this.showNext.bind(this);
    this.swipe = this.swipe.bind(this);
    this.update = this.update.bind(this);
    this.init(swiper, options);
    this.activateControlsByIndexes(swiper);

    if (this.options.showControls) {
      this.createControls();
      this.activateControls();
    }
  }

  public init(swiper: Element, options: SwiperOptions): void {
    this.supportEvents = window.supportTouchEvents()
      ? Swiper.TOUCH_EVENTS
      : Swiper.MOUSE_EVENTS;

    this.index = 0;
    this.initDistance = 0;
    this.traveledDistance = 0;
    this.options = options;

    this.swiper = swiper
      .querySelector(`.${ Swiper.SWIPER_CLASS }`) as HTMLElement;
    this.container = swiper
      .querySelector(`.${ Swiper.CONTAINER_CLASS }`) as HTMLElement;
    this.items = this.container.querySelectorAll(`.${ Swiper.ITEM_CLASS }`);

    this.swiper.addEventListener(this.supportEvents.down, this.actionDown);
    this.swiper.addEventListener(this.supportEvents.click, event => {
      if (this.traveledDistance !== 0
        && this.supportEvents.down === Swiper.MOUSE_EVENTS.down) {
        event.preventDefault();
      }
    });

    window.onEvent(Swiper.WINDOW_EVENT, this.update, 1);
  }

  public animate(distance: number, velocity: number): void {
    const translate = `translate3d(${ -1 * distance }px, 0px, 0px)`;

    this.container.style.transform = translate;
    this.container.style.transitionDuration = `${ velocity }ms`;
  }

  public activateControls(): void {
    if (this.options.showControls) {
      if (this.index > 0) {
        this.prevCtrl.addClasses([Swiper.ACTIVE_CTRL_CLASS]);
      } else {
        this.prevCtrl.removeClasses([Swiper.ACTIVE_CTRL_CLASS]);
      }

      if (this.index < this.lastToShow()) {
        this.nextCtrl.addClasses([Swiper.ACTIVE_CTRL_CLASS]);
      } else {
        this.nextCtrl.removeClasses([Swiper.ACTIVE_CTRL_CLASS]);
      }
    }
  }

  public createControls(): void {
    this.prevCtrl = new DOMElement('div');
    this.nextCtrl = new DOMElement('div');
    this.prevCtrl.addClasses(this.options.prevCtrlClasses);
    this.nextCtrl.addClasses(this.options.nextCtrlClasses);
    this.prevCtrl.render(this.swiper);
    this.nextCtrl.render(this.swiper);
    this.prevCtrl.addEvents([{
      callback: this.showPrev,
      name: Swiper.ACTIVE_EVENT_CTRL
    }]);
    this.nextCtrl.addEvents([{
      callback: this.showNext,
      name: Swiper.ACTIVE_EVENT_CTRL
    }]);
  }

  public containerFullWidth(): number {
    return this.container.scrollWidth - this.container.offsetWidth;
  }

  public lastToShow(): number {
    let distance = 0;
    const totalItems = this.items.length - 1;

    for (let i = totalItems; i >= 0; i--) {
      const item = this.items[i] as HTMLElement;

      distance = distance + item.offsetWidth;

      if (distance > this.container.offsetWidth) {
        if (distance < this.container.offsetWidth + totalItems) {
          return i;
        }

        return i + 1;
      }
    }

    return totalItems;
  }

  public showPrev(): void {
    if (this.index > 0) {
      this.index = --this.index;
      const currentItem = this.items[this.index] as HTMLElement;

      this.animate(currentItem.offsetLeft, this.options.animationMs);
      this.activateControls();
    }
  }

  public showNext(): void {
    const lastToShow = this.lastToShow();

    if (this.index + 1 <= lastToShow) {
      ++this.index;

      if (this.index < lastToShow) {
        const currentItem = this.items[this.index] as HTMLElement;

        this.animate(currentItem.offsetLeft, this.options.animationMs);
      } else {
        this.animate(this.containerFullWidth(), this.options.animationMs);
      }
    }

    this.activateControls();
  }

  public update(): void {
    const lastToShow = this.lastToShow();

    if (this.index < lastToShow) {
      const currentItem = this.items[this.index] as HTMLElement;

      this.animate(currentItem.offsetLeft, 0);
    } else {
      this.index = lastToShow;
      this.animate(this.containerFullWidth(), 0);
    }

    this.activateControls();
  }

  public swipe(moveEvent: any): void {
    moveEvent.preventDefault();

    const distanceEvent = (this.supportEvents.move === Swiper.TOUCH_EVENTS.move)
      ? moveEvent.touches[0].clientX
      : moveEvent.screenX;

    let distance = this.firstPointX - distanceEvent + this.initDistance;
    const outRange = this.container.offsetWidth / Swiper.SWIPE_OUT_RANGE;
    const minDistance = Math.round(outRange) * -1;
    const maxDistance = outRange + this.containerFullWidth();

    if (distance < minDistance) {
      distance = minDistance;
    } else if (distance > maxDistance) {
      distance = maxDistance;
    }

    this.animate(distance, 0);
  }

  public actionDown(downEvent: any): void {
    if (this.supportEvents.down === Swiper.MOUSE_EVENTS.down) {
      downEvent.preventDefault();
    }

    this.firstPointY = (this.supportEvents.down === Swiper.TOUCH_EVENTS.down)
      ? downEvent.touches[0].clientY
      : downEvent.screenY;

    this.firstPointX = (this.supportEvents.down === Swiper.TOUCH_EVENTS.down)
      ? downEvent.touches[0].clientX
      : downEvent.screenX;

    let transform = this.container.style.transform;

    if (transform) {
      transform = transform.split('(')[1];
      transform = transform.split(')')[0];
      transform = transform.split(',')[0];
      transform = transform.replace('-', '');
      transform = transform.replace('px', '');
      this.initDistance = Number(transform);
    } else {
      this.initDistance = 0;
    }

    this.swiper.addEventListener(this.supportEvents.move, this.activateSwipe);
  }

  public activateSwipe(moveEvent: any): void {
    const distanceY = (this.supportEvents.move === Swiper.TOUCH_EVENTS.move)
      ? moveEvent.touches[0].clientY
      : moveEvent.screenY;

    if (Math.abs(this.firstPointY - distanceY) < 5) {
      this.swiper.addEventListener(this.supportEvents.move, this.swipe);
      this.swiper.addEventListener(this.supportEvents.up, this.actionUp);
      window.addEventListener(this.supportEvents.move, this.swipe);
      window.addEventListener(this.supportEvents.up, this.actionUp);
    } else {
      this.swiper.removeEventListener(
        this.supportEvents.move, this.activateSwipe
      );
    }
  }

  public actionUp(upEvent: any): void {
    const distanceEvent = (this.supportEvents.up === Swiper.TOUCH_EVENTS.up)
      ? upEvent.changedTouches[0].clientX
      : upEvent.screenX;

    this.traveledDistance = this.firstPointX - distanceEvent;

    const distance = this.traveledDistance + this.initDistance;
    const lastToShow = this.lastToShow();

    for (let i = 0; i <= lastToShow; i++) {
      const item = this.items[i] as HTMLElement;
      const ajustDistance = (item.offsetWidth * Swiper.SWIPE_PERCENT_AJUST)
        / 100;
      const minDistance = this.traveledDistance > 0
        ? item.offsetLeft + ajustDistance
        : item.offsetLeft + item.offsetWidth - ajustDistance;

      if (i < lastToShow && minDistance > distance) {
        this.animate(item.offsetLeft, this.options.animationMs);
        this.index = i;

        break;
      } else if (i === lastToShow) {
        this.animate(this.containerFullWidth(), this.options.animationMs);
        this.index = lastToShow;
      }
    }

    this.activateControls();
    this.swiper.removeEventListener(this.supportEvents.move, this.swipe);
    this.swiper.removeEventListener(this.supportEvents.up, this.actionUp);
    window.removeEventListener(this.supportEvents.move, this.swipe);
    window.removeEventListener(this.supportEvents.up, this.actionUp);
  }

  public activateControlsByIndexes(swiper): void {
    const thumbsContainer = swiper
      .querySelector(`.${ Swiper.THUMBNAILS_CONTAINER_CLASS }`);

    if (thumbsContainer) {
      this.thumbnails = thumbsContainer
        .querySelectorAll(`.${ Swiper.THUMBNAIL_ITEM_CLASS }`);

      const itemsSize = this.items.length;
      const thumbnailsSize = this.thumbnails.length;

      if (itemsSize === thumbnailsSize) {
        for (let i = 0; i < itemsSize; i++) {
          const thumbnail = this.thumbnails[i] as HTMLElement;
          const item = this.items[i] as HTMLElement;

          thumbnail.addEventListener(Swiper.ACTIVE_EVENT, this.showByIndex);
          item.style.width = Swiper.ITEM_MAGNIFY_WIDTH;
        }
      } else {
        throw new Error('Error: Thumbnails and Items have different length');
      }
    }
  }

  public showByIndex(event: Event): void {
    const target = event.target as HTMLElement;
    const thumbnailsSize = this.thumbnails.length;
    const thumbnail = DOMUtils.findParentElementByClass(
      target,
      Swiper.THUMBNAIL_ITEM_CLASS
    );

    for (let i = 0; i < thumbnailsSize; i++) {
      if (this.thumbnails[i] === thumbnail) {
        const itemToShow = this.items[i] as HTMLElement;

        this.index = i;
        this.activateControls();
        this.animate(itemToShow.offsetLeft, this.options.animationMs);

        break;
      }
    }
  }
}

export { Swiper, SwiperOptions };
