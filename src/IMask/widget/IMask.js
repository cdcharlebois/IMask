/**
 * @author Conner Charlebois (Mendix)
 * @since Oct 10, 2018
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
    _isSetup: null,
    // modeler
    label: null,
    attribute: null,
    placeholderText: null,
    maskString: null,
    customMaskDefs: null, // {char, def}
    onAcceptNanoflow: null,
    onCompleteNanoflow: null,
    onCompleteMicroflow: null,
    // nodes
    labelNode: null,
    inputNode: null,

    constructor() {
        this.log = log.bind(this);
        this.runCallback = runCallback.bind(this);
    },

    postCreate() {
        log.call(this, 'postCreate', this._WIDGET_VERSION);
        if (this.label) {
            this.labelNode.innerText = this.label;
        } else {
            this.labelNode.style.display = "none";
        }
        this._isSetup = false;
    },

    update(obj, callback) {
        if (obj) {
            this._contextObj = obj;
        }
        this.inputNode.placeholder = this.placeholderText;
        if (!this._isSetup) {
            this._setupMask();
        }
        if (callback && "function" == typeof callback) {
            callback();
        }
    },

    _setupMask() {
        var node = this.inputNode;
        var maskOptions = this._getMaskOptions();
        this.Mask = new IMask(node, maskOptions);
        this.Mask.on("accept", this._onAccept.bind(this));
        this.Mask.on("complete", this._onComplete.bind(this));
        this._isSetup = true;
        this._resetSubscriptions();
    },

    _onAccept() {
        console.debug("IMask onaccept")
        this._contextObj.set(this.attribute, this.Mask.unmaskedValue);
        if (this._doesNanoflowExist(this.onAcceptNanoflow)) {
            mx.data.callNanoflow({
                nanoflow: this.onAcceptNanoflow,
                origin: this.mxform,
                context: this.mxcontext,
                callback: function (result) {
                    console.debug("nanoflow ok")
                },
                error: function (error) {
                    console.error(error)
                }
            });
        }
    },

    _onComplete() {
        console.debug("IMask oncomplete");
        this._contextObj.set(this.attribute, this.Mask.unmaskedValue);
        if (this._doesNanoflowExist(this.onCompleteNanoflow)) {
            mx.data.callNanoflow({
                nanoflow: this.onCompleteNanoflow,
                origin: this.mxform,
                context: this.mxcontext,
                callback: function (result) {
                    console.debug("nanoflow ok")
                },
                error: function (error) {
                    console.error(error)
                }
            });
        } else if (this.onCompleteMicroflow) {
            mx.data.action({
                params: {
                    applyto: "selection",
                    actionname: this.onCompleteMicroflow,
                    guids: [this._contextObj.getGuid()]
                },
                origin: this.mxform,
                callback: function (obj) {
                    // expect single MxObject
                    console.debug("microflow ok")
                },
                error: function (error) {
                    console.error(error)
                }
            });
        }
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
                this.Mask.unmaskedValue = this._contextObj.get(this.attribute);
                this.Mask.updateValue();
            }.bind(this)
        });
    },

    _doesNanoflowExist(nanoflow) {
        return Object.keys(nanoflow).length > 0;
    },

    uninitialize() {
        this.Mask.destroy();
    }
});
