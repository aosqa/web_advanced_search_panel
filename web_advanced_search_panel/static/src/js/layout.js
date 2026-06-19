/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { Layout ,extractLayoutComponents as originalExtract } from "@web/search/layout";
import { AdvancedSearchPanel } from "./custom_filter_panel";




export function extractLayoutComponents(params) {
    const layoutComponents = originalExtract(params);
    // Add our panel 
    // component
    layoutComponents.AdvancedSearchPanel = AdvancedSearchPanel;
    return layoutComponents;
}

patch(Layout.prototype, {
    setup() {
        super.setup();
        this.AdvancedSearchPanel = AdvancedSearchPanel;

    },

    get hasAdvancedPanel() {
        return true;
    },
});