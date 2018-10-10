/**
 * @todo placeholder text - DONE
 * @todo mask - DONE
 * @todo character definitions - DONE
 * @todo onAccept
 * @todo onComplete
 */
import {
    defineWidget,
    log,
    runCallback,
} from 'widget-base-helpers';
import IMask from 'imask';
import template from './IMask.template.html'

export default defineWidget('IMask', template, {

    _contextObj: null,
    // modeler
    attribute: null,
    placeholderText: null,
    maskString: null,
    customMaskDefs: null, // {char, def}
    // nodes
    labelNode: null,
    inputNode: null,

    constructor() {
        this.log = log.bind(this);
        this.runCallback = runCallback.bind(this);
    },

    postCreate() {
        log.call(this, 'postCreate', this._WIDGET_VERSION);
    },

    update(obj, callback) {
        if (obj) {
            this._contextObj = obj;
        }
        this.inputNode.placeholder = this.placeholderText;
        this._setupMask();
        if (callback && "function" == typeof callback) {
            callback();
        }
    },

    _setupMask() {
        var node = this.inputNode;
        var maskOptions = this._getMaskOptions();
        this.Mask = new IMask(node, maskOptions);
        this.Mask.on("accept", function () {
            console.log("accept"); // todo
            this._contextObj.set(this.attribute, this.Mask.unmaskedValue)
        }.bind(this))
        this.Mask.on("complete", function () {
            console.log("complete"); // todo
            this.Mask.value = this.Mask.value.toUpperCase()
            this._contextObj.set(this.attribute, this.Mask.unmaskedValue)
        }.bind(this))
        this._resetSubscriptions();
    },

    _getMaskOptions() {
        var maskOptions = {};
        maskOptions.mask = this.maskString;
        // custom definitions
        var customDefs = {};
        for (var i = 0; i < this.customMaskDefs.length; i++) {
            // {char: 'y', def: '[abc]'}
            customDefs[this.customMaskDefs[i].char] = new RegExp(this.customMaskDefs[i].def);
        }
        maskOptions.definitions = customDefs;
        return maskOptions;
    },

    _resetSubscriptions() {
        this.unsubscribeAll();
        this.subscribe({
            guid: this._contextObj.getGuid(),
            attr: this.attribute,
            callback: function (guid, attr, attrValue) {
                this.Mask.value = this._contextObj.get(this.attribute);
            }.bind(this)
        });
    },

    uninitialize() {
        this.Mask.destroy();
    }
});
