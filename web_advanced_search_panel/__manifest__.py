{
    "name": "Odoo Quick Search Panel",
    "version": "17.0.1.0.0",
    "category": "Web",
   "summary": "Display selected search fields inline in the top search bar using context",

    "description": """
Web Advanced Search Panel

This module enhances the default Odoo search experience by allowing developers
to display selected search fields directly in the top search bar.

By simply adding the context key 'show_in_line': True to a field in the search view,
the field will appear inline, eliminating the need to open the advanced search panel.

Key Features:
- Display search fields inline in the top search bar
- Easy activation using context in XML
- Seamless integration with Odoo UI
- Supports multiple field types
- Improves usability and reduces clicks

Usage:
Add the following context to any search field:

    <field name="date" context="{'show_in_line': True}"/>

This will make the field visible directly in the search input area.

Ideal for:
- Frequently used filters
- Improving user efficiency
- Enhancing search UX across modules (Sales, Accounting, HR, Inventory)

""",
    'author': "Abduselam M.",
    'maintainer': 'Abdulselam M. abdulselam4246@gmail.com',
    "depends": ["web"],
    "assets": {
        "web.assets_backend": [
            "web_advanced_search_panel/static/src/js/custom_filter_panel.js",
            "web_advanced_search_panel/static/src/xml/custom_filter_panel.xml",
            "web_advanced_search_panel/static/src/js/layout.js",
            "web_advanced_search_panel/static/src/xml/layout.xml",
        ],
    },
    "installable": True,
    "application": False,
    "license": "LGPL-3",
    'images': ['static/description/banner.png'],
}
