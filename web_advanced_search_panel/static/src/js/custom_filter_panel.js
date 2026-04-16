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
import { DateTimePicker } from "@web/core/datetime/datetime_picker";
import { DateTimePickerPopover } from "@web/core/datetime/datetime_picker_popover";

import { DateTimeInput } from "@web/core/datetime/datetime_input";


export class AdvancedSearchPanel extends SearchBar {
    setup() {
        super.setup(); // <-- important, runs parent setup
        this.state = useState({
            filters: {},
            searchFields: [],
            values: {},     // <-- must be an array, not undefined
        });
        this.fromDateRef = useRef("fromDate");
        this.toDateRef = useRef("toDate");
        this.partnerRef = useRef("partnerId");
        this.rootRef = useRef("root");
        this.applyFilter = this.applyFilter.bind(this);  
        this.onDateChange = this.onDateChange.bind(this)
        
        this.updateFields();

        // update when model/view changes
        useBus(this.env.searchModel, "update", () => {
            this.updateFields();
        });

        
    }
    

    

    updateFields() {
        const fields = this.env.searchModel.searchItems || {};
        console.log("All search fields from search model:", fields);
    
        let index = 0;
    
        this.state.searchFields = Object.values(fields)
            .filter(f => {
                if (!f || f.type !== 'field' || !f.fieldName) return false;
    
                // Parse context string safely
                let contextObj = {};
                if (typeof f.context === "string") {
                    try {
                        // Replace Python-style True/False with JS true/false
                        const jsonString = f.context.replace(/'/g, '"').replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false');
                        contextObj = JSON.parse(jsonString);
                    } catch (e) {
                        console.warn("Failed to parse context for field", f.fieldName, e);
                    }
                } else if (typeof f.context === "object") {
                    contextObj = f.context;
                }
    
                // Include only fields where show_in_line is true
                return contextObj.show_in_line === true;
            })
            .map(f => ({
                ...f,
                _id: `${f.fieldName}_${index++}`,
            }));
    
        console.log("Inline search fields:", this.state.searchFields);
    }
   


   

    onInput(fieldName, value) {
        this.state.values[fieldName] = value;
    }
    
   

    onDateChange(key, value) {
        this.state.values[key] = value;
    }

    onKeyDown(ev) {
        if (ev.key === "Enter") {
            ev.preventDefault(); // avoid weird behavior
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
            else if (field.fieldType === "many2one" && value) {
                domain.push([field.fieldName, "ilike", value]);
            } 
            else if (field.fieldType === "date") {
                const from = this.state.values[`${field.fieldName}_from`];
                const to   = this.state.values[`${field.fieldName}_to`];
                if (from) {
                    domain.push([
                        field.fieldName,
                        ">=",
                        serializeDate(from)
                    ]);
                }
    
                if (to) {
                    domain.push([
                        field.fieldName,
                        "<=",
                        serializeDate(to)
                    ]);
                }
            }
        });
    
        // ✅ remove only your fields (correct)
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



AdvancedSearchPanel.components = { Dropdown, DropdownItem,DateTimePicker ,DateTimePickerPopover,DateTimeInput};
AdvancedSearchPanel.template = "web_advanced_search_panel.AdvancedSearchPanel";