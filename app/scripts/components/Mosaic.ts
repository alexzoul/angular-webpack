import './Window';
import { DOMElement } from './DOMElement';
import { DOMUtils } from './DOMUtils';

class Mosaic {
  static readonly WINDOW_EVENT: string = 'resize';
  static readonly ACTIVE_CLASS: string = 'active';
  static readonly TOUCH_EVENT: string = 'touchstart';
  static readonly MOUSE_EVENT: string = 'mouseenter';
  static readonly ITEM_CLASS: string = 'mosaic-item';
  static readonly DETAIL_CLASS: string = 'mosaic-detail';
  static readonly DETAIL_CONTAINER_HTML_TYPE: string = 'div';
  static readonly DETAIL_CONTAINER_CLASSES: string[] = ['mosaic-detail'];
  static readonly KEY_ATRRS_TO_RENDER: string = 'data-mosaic-[]';
  static readonly CONTAINER_CLASS: string = 'mosaic-container';
  static readonly MIN_CONTAINER_PERCENT: number = 25;
  static readonly ATTRS_TO_RENDER: string [] = ['title', 'desc', 'image'];
  static readonly DETAIL_TEMPLATE: string = `
    <div class="content">
      <div class="title">[${ Mosaic.ATTRS_TO_RENDER[0] }]</div>
      <div class="desc">[${ Mosaic.ATTRS_TO_RENDER[1] }]</div>
      <img src="[${ Mosaic.ATTRS_TO_RENDER[2] }]">
    </div`;

  public items: NodeListOf<Element>;
  public activedItem: HTMLElement;
  public detailContainer: DOMElement;
  public itemsContainer: HTMLElement;
  public mosaic: HTMLElement;
  public supportEvents: string;

  constructor(mosaic) {
    this.mosaic = mosaic;
    this.items = mosaic.querySelectorAll(`.${ Mosaic.ITEM_CLASS }`);
    this.detailContainer = new DOMElement('div');
    this.itemsContainer = mosaic.querySelector(`.${ Mosaic.CONTAINER_CLASS }`);
    this.activedItem = this.items[0] as HTMLElement;
    this.showDetail = this.showDetail.bind(this);
    this.renderDetail = this.renderDetail.bind(this);
    this.renderDetail();

    const activeEvent = window.supportTouchEvents()
      ? Mosaic.TOUCH_EVENT
      : Mosaic.MOUSE_EVENT;

    DOMUtils.syncForEach(item => {
      item.addEventListener(activeEvent, this.showDetail);
    }, this.items);

    window.onEvent(Mosaic.WINDOW_EVENT, this.renderDetail, 1);
  }

  public showDetail(event): void {
    const target = event.target;
    const item = DOMUtils.findParentElementByClass(target, Mosaic.ITEM_CLASS);

    DOMUtils.removeClassToItems(this.items, Mosaic.ACTIVE_CLASS);
    this.activedItem = item;
    this.renderDetail();
  }

  public renderDetail(): void {
    this.detailContainer.destroy();
    this.createDetailContainer();

    DOMUtils.addClass(this.activedItem, Mosaic.ACTIVE_CLASS);

    const mosaicWidth = this.mosaic.offsetWidth;
    const itemsContainerWitdh = this.itemsContainer.offsetWidth;
    const availableDistance = mosaicWidth - itemsContainerWitdh;
    const minimumDistance = (mosaicWidth * Mosaic.MIN_CONTAINER_PERCENT) / 100;

    if (availableDistance >= minimumDistance) {
      const styles = { height: `${ this.itemsContainer.offsetHeight }px` };

      this.detailContainer.setStyles(styles);
      this.detailContainer.render(this.mosaic);
    } else {
      const indexToInsert = this.lastItemOfActivedRow();
      const styles = { width: `${ itemsContainerWitdh }px` };

      this.detailContainer.setStyles(styles);
      this.detailContainer.renderBefore(this.itemsContainer, indexToInsert);
    }
  }

  public createDetailContainer(): void {
    let template = Mosaic.DETAIL_TEMPLATE;
    const attrsToRenderSize = Mosaic.ATTRS_TO_RENDER.length;

    for (let i = 0; i < attrsToRenderSize; i++) {
      const attribute = Mosaic.ATTRS_TO_RENDER[i];
      const keyAttribute = Mosaic.KEY_ATRRS_TO_RENDER.replace('[]', attribute);
      const value = this.activedItem.getAttribute(keyAttribute);

      template = template.replace(`[${ attribute }]`, value);
    }

    this.detailContainer = new DOMElement(Mosaic.DETAIL_CONTAINER_HTML_TYPE);
    this.detailContainer.setContent(template);
    this.detailContainer.addClasses(Mosaic.DETAIL_CONTAINER_CLASSES);
  }

  public itemsPerRow(): Array<number> {
    let distance = 0;
    let itemsCount = 0;
    const itemsPerRow = [];
    const itemsSize = this.items.length;

    for (let i = 0; i < itemsSize; i++) {
      const item = this.items[i] as HTMLElement;

      distance = distance + item.offsetWidth;

      if (distance > this.itemsContainer.offsetWidth) {
        itemsPerRow.push(itemsCount);
        distance = item.offsetWidth;
        itemsCount = 0;
      } else if (i === itemsSize - 1) {
        itemsPerRow.push(itemsCount + 1);
      }

      ++itemsCount;
    }

    return itemsPerRow;
  }

  public lastItemOfActivedRow(): number {
    let item = 0;
    const itemsPerRow = this.itemsPerRow();
    const rows = itemsPerRow.length;
    const indexElement = DOMUtils.getIndexNode(this.activedItem);

    for (let i = 0; i < rows; i++) {
      item = item + itemsPerRow[i];

      if (item >= indexElement) {
        return item;
      }
    }
  }
}

export { Mosaic };
