/** @odoo-module **/
import {
    Component,
    onMounted,
    onWillPatch,
    onWillStart,
    useEffect,
    useRef,
    useState,
    useSubEnv,
} from "@odoo/owl";
import { SearchBar } from "@web/search/search_bar/search_bar";
import { serializeDate, deserializeDate } from "@web/core/l10n/dates";
import { useBus, useService } from "@web/core/utils/hooks";
import { Dropdown } from "@web/core/dropdown/dropdown";
import { DropdownItem } from "@web/core/dropdown/dropdown_item";
import { DateTimeInput } from "@web/core/datetime/datetime_input";
import { Many2XAutocomplete } from "@web/views/fields/relational_utils";

export class AdvancedSearchPanel extends SearchBar {
    setup() {
        super.setup(); 
        this.orm = useService('orm');
        this.fieldsInfo = {};
        if (!this.env.searchModel) {
            return;
        }

        this.state = useState({
            filters: {},
            searchFields: [],
            values: {}, // Format stored: { partner_id: { id: 5, label: "Awash Bank" } }
        });
        
        this.rootRef = useRef("root");
        this.applyFilter = this.applyFilter.bind(this);  
        this.onDateChange = this.onDateChange.bind(this);
        
        this.updateFields();

        useBus(this.env.searchModel, "update", () => {
            this.updateFields();
        });

        onWillStart(async () => {
            this.fieldsInfo = await this.orm.call(
                this.env.searchModel.resModel,
                "fields_get",
                [],
                { attributes: ["relation", "type"] }
            );
        });
    }

    updateFields() {
        if (!this.env.searchModel || !this.env.searchModel.searchItems) {
            return;
        }
        const fields = this.env.searchModel.searchItems || {};
    
        let index = 0;
        this.state.searchFields = Object.values(fields)
            .filter(f => {
                if (!f || f.type !== 'field' || !f.fieldName) return false;
    
                let contextObj = {};
                if (typeof f.context === "string") {
                    try {
                        const jsonString = f.context.replace(/'/g, '"').replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false');
                        contextObj = JSON.parse(jsonString);
                    } catch (e) {
                        console.warn("Failed to parse context for field", f.fieldName, e);
                    }
                } else if (typeof f.context === "object") {
                    contextObj = f.context;
                }
    
                return contextObj.show_in_line === true;
            })
            .map(f => ({
                ...f,
                _id: `${f.fieldName}_${index++}`,
            }));
    }

    onInput(fieldName, value) {
        this.state.values[fieldName] = value;
    }

    onMany2OneChange(fieldName, selection) {
        console.log("field name",fieldName)
        console.log("selection",this.state.values)

        if (selection && selection.length > 0) {
            this.state.values[fieldName] = {
                id: selection[0].id,
                display_name: selection[0].label || selection[0].display_name || ""
            };
        } else {
            this.state.values[fieldName] = false;
        }
    }
   

    // Centrally build and type-cast options to comply with Odoo 18 validation
     getAutocompleteProps(field) {
        const selectedRecord = this.state.values[field.fieldName];
        const targetModel = this.fieldsInfo[field.fieldName]?.relation;
        return {
            resModel: targetModel,
            value: selectedRecord ? selectedRecord.display_name : "", // Odoo 18 expects string display value here
            placeholder: field.description || "",
            fieldString: field.description || "Field",
            isToMany: false,
            activeActions: {},
            quickCreate: null,
            searchLimit:50,
            noSearchMore: true,
            getDomain: () => [],
            update: (selection) => this.onMany2OneChange(field.fieldName, selection),
        };
    }

    onDateChange(key, value) {
        this.state.values[key] = value;
    }

    onKeyDown(ev) {
        if (ev.key === "Enter") {
            ev.preventDefault();
            this.applyFilter();
        }
    }

    applyFilter() {
        const domain = [];
    
        this.state.searchFields.forEach(field => {
            const value = this.state.values[field.fieldName];
    
            if (field.fieldType === "char" && value) {
                domain.push([field.fieldName, "ilike", value]);
            } 
            else if (field.fieldType === "many2one" && value && value.id) {
                domain.push([field.fieldName, "=", value.id]);
            } 
            else if (field.fieldType === "date") {
                const from = this.state.values[`${field.fieldName}_from`];
                const to   = this.state.values[`${field.fieldName}_to`];
                if (from) {
                    domain.push([field.fieldName, ">=", serializeDate(from)]);
                }
                if (to) {
                    domain.push([field.fieldName, "<=", serializeDate(to)]);
                }
            }
        });
    
        const advancedFieldNames = this.state.searchFields.map(f => f.fieldName);
        const facets = this.env.searchModel.facets || [];
    
        const groupIdsToRemove = facets
            .filter(facet => {
                if (!facet.domain) return false;
                return advancedFieldNames.some(field =>
                    facet.domain.includes(`"${field}"`) ||
                    facet.domain.includes(`'${field}'`)
                );
            })
            .map(facet => facet.groupId);
    
        groupIdsToRemove.forEach(groupId => {
            this.env.searchModel.deactivateGroup(groupId);
        });
    
        this.env.searchModel.splitAndAddDomain(domain);
    }
}

AdvancedSearchPanel.components = { Dropdown, DropdownItem, DateTimeInput, Many2XAutocomplete };
AdvancedSearchPanel.template = "web_advanced_search_panel.AdvancedSearchPanel";