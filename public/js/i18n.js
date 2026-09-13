// KisanSetu - Internationalization (i18n) Module
// Supports English (en), Hindi (hi), and Marathi (mr)

(function() {
  const TRANSLATIONS = {
    en: {
      // Brand & Navigation
      "brand_name": "KisanSetu",
      "tagline": "Direct Farm-to-Fork Marketplace",
      "for_farmers": "For Farmers",
      "for_buyers": "For Buyers",
      "about": "About",
      "contact": "Contact",
      "sign_in": "Sign In",
      "sign_up": "Sign Up",
      "sign_out": "🚪 Sign Out",
      "switch_to_farmer": "🧑‍🌾 Switch to Farmer",
      "switch_to_buyer": "🛒 Switch to Buyer",
      "back_to_home": "← Back to KisanSetu",
      "dev_by": "Developed by",

      // Landing Page
      "hero_title": "Direct from Soil to Soul",
      "hero_sub": "Connecting Indian farmers directly with consumers. Fresh harvests, transparent pricing, zero middlemen.",
      "farmer_card_title": "I am a Farmer",
      "farmer_card_desc": "List your fresh harvest, control your prices, track profits, and connect directly with local buyers.",
      "buyer_card_title": "I am a Buyer",
      "buyer_card_desc": "Buy farm-fresh vegetables, fruits, and grains directly from nearby verified farmers at honest rates.",
      "contact_head": "Get in Touch",
      "contact_sub": "Have questions, suggestions, or need support? Our team is always here to assist farmers and consumers.",
      "contact_email_label": "Direct Support Email",
      "team_label": "Hackathon Team",

      // Auth Page
      "auth_title_signin": "Welcome back",
      "auth_title_signup": "Create account",
      "auth_sub_signin": "Sign in to continue to KisanSetu",
      "auth_sub_signup": "Join KisanSetu as a farmer or consumer",
      "label_name": "Full Name",
      "label_email": "Email",
      "label_password": "Password",
      "label_i_am": "I am a...",
      "role_farmer": "Farmer",
      "role_consumer": "Consumer",
      "placeholder_name": "Your full name",
      "placeholder_email": "your@email.com",
      "placeholder_password": "Min 6 characters",
      "btn_signin": "Sign In",
      "btn_signup": "Create Account",
      "or_divider": "or continue with",
      "btn_google": "Sign in with Google",
      "google_role_hint": "Select your role for Google sign-up:",

      // Farmer Tabs & Headers
      "tab_products": "Products",
      "tab_revenue": "Revenue",
      "tab_stock": "Stock",
      "tab_delivery": "Delivery",
      "tab_chat": "Chat",
      "tab_profile": "Profile",
      "head_products_title": "Your Products",
      "head_products_sub": "Add crops, tweak prices, retire what's sold out.",
      "head_revenue_title": "Revenue & Costs",
      "head_revenue_sub": "Track your earnings and profit margins.",
      "head_stock_title": "Stock Management",
      "head_stock_sub": "Keep your inventory up to date.",
      "head_delivery_title": "Delivery Settings",
      "head_delivery_sub": "Manage your availability and delivery notes.",
      "head_chat_title": "Chat & Requests",
      "head_chat_sub": "Connect with consumers and fellow farmers.",
      "head_profile_title": "Your Profile",
      "head_profile_sub": "Update your personal info and location.",

      // Farmer Modals & Forms
      "btn_add_crop": "+ Add a crop",
      "modal_title_add": "Add a crop",
      "modal_title_edit": "Edit crop",
      "field_crop_name": "Crop name",
      "placeholder_crop_name": "e.g. Alphonso Mangoes",
      "field_category": "Category",
      "field_unit": "Unit",
      "field_price": "Your price (₹)",
      "field_cost": "Cost to grow (₹)",
      "field_stock": "Stock available",
      "field_crop_photo": "Crop Photo (Optional)",
      "btn_save_crop": "Save crop",
      "btn_cancel": "Cancel",
      "btn_save": "Save",
      "btn_edit": "Edit",
      "btn_delete": "Delete",

      // Categories & Units
      "cat_vegetable": "Vegetable",
      "cat_fruit": "Fruit",
      "cat_grain": "Grain",
      "cat_spice": "Spice",
      "cat_dairy": "Dairy",
      "unit_kg": "kg",
      "unit_pc": "pc",
      "unit_dozen": "dozen",
      "unit_litre": "litre",

      // Stats
      "stat_in_stock": "In Stock",
      "stat_out_stock": "Out of Stock",
      "stat_low_stock": "Low Stock",
      "stat_total_crops": "Total Crops",
      "stat_rev_potential": "Revenue Potential",
      "stat_total_cost": "Total Cost Basis",
      "stat_est_margin": "Estimated Margin",
      "per_crop_margin": "Per-Crop Margin",
      "profit": "Profit",
      "price": "Price",
      "cost": "Cost",

      // Delivery
      "delivery_status": "Delivery Status",
      "status_available": "Available for delivery",
      "status_out": "Out on delivery right now",
      "status_off": "Not delivering today",
      "delivery_note": "Delivery Note",
      "save_delivery_btn": "Save Delivery Settings",

      // Chat & Search
      "search_users_title": "Search Users",
      "search_placeholder_farmer": "Search buyers or farmers by name...",
      "btn_search": "Search",
      "btn_send_request": "Send Request",
      "pending_requests": "Pending Requests",
      "active_convs": "Active Conversations",
      "no_pending_req": "No pending requests.",
      "no_active_conv": "No active conversations.",
      "btn_accept": "Accept",
      "btn_decline": "Decline",
      "chat_placeholder": "Type a message…",
      "btn_send": "Send",

      // Profile
      "change_photo": "Change",
      "profile_phone": "Phone Number",
      "profile_address": "Address / Village",
      "profile_city": "City / Town",
      "profile_state": "State / Province",
      "location_title": "Location Coordinates",
      "btn_location": "📍 Use Current Location",
      "btn_save_profile": "Save Profile",

      // Consumer Dashboard
      "tab_browse": "Browse",
      "tab_nearby": "Nearby",
      "tab_cart": "Cart",
      "search_crops_placeholder": "Search crops, farmers...",
      "btn_add_to_cart": "Add to Cart",
      "btn_chat_farmer": "💬 Chat",
      "cart_title": "Your Cart",
      "cart_empty": "Your cart is empty.",
      "cart_total": "Total:",
      "btn_place_order": "Place Order",
      "nearby_title": "Nearby Farmers",
      "nearby_sub": "Find verified farmers near your current location.",
      "btn_find_nearby": "📍 Find Farmers Near Me",
      "no_farmers_found": "No farmers found nearby.",
      "loading": "Loading...",
      "loading_products": "Loading products...",
      "no_products_found": "No products found.",
      "verified_farmer": "Verified Farmer",
      "delivery_note_placeholder": "e.g. Free delivery within 5km, orders after 6 PM next day",
      "no_users_found": "No users found.",
      "searching": "Searching...",
      "sent_req_text": "sent a request",
      "you_requested_chat": "You requested to chat with",
      "stat_pending": "Pending",
      "getting_location": "Getting your location...",
      "searching_nearby": "Searching farmers nearby...",
      "delivery_address_label": "Delivery Address",
      "profile_sub_consumer": "Set your name and location to find nearby farmers and chat directly.",
      "profile_sub_farmer": "Set your full name and farm details so consumers can search and contact you.",
      "online": "Online",
      "added_to_cart": "added to cart!",
      "btn_checkout": "Place Order",
      "order_success": "Order placed successfully! 🎉",
      "chat_req_sent": "Chat request sent!",
      "save_profile_success": "Profile saved successfully! 🎉"
    },

    hi: {
      // Brand & Navigation
      "brand_name": "किसानसेतु",
      "tagline": "खेत से थाली तक सीधा बाज़ार",
      "for_farmers": "किसानों के लिए",
      "for_buyers": "खरीदारों के लिए",
      "about": "हमारे बारे में",
      "contact": "संपर्क करें",
      "sign_in": "साइन इन",
      "sign_up": "साइन अप",
      "sign_out": "🚪 लॉग आउट",
      "switch_to_farmer": "🧑‍🌾 किसान बनें",
      "switch_to_buyer": "🛒 खरीदार बनें",
      "back_to_home": "← किसानसेतु पर वापस जाएं",
      "dev_by": "द्वारा विकसित",

      // Landing Page
      "hero_title": "सीधे मिट्टी से आपकी थाली तक",
      "hero_sub": "भारतीय किसानों को सीधे उपभोक्ताओं से जोड़ना। ताजी फसलें, पारदर्शी दाम, बिना किसी बिचौलिए के।",
      "farmer_card_title": "मैं एक किसान हूँ",
      "farmer_card_desc": "अपनी ताज़ा फसल सूचीबद्ध करें, अपने दाम तय करें, मुनाफा ट्रैक करें और सीधे खरीदारों से जुड़ें।",
      "buyer_card_title": "मैं एक खरीदार हूँ",
      "buyer_card_desc": "आस-पास के सत्यापित किसानों से उचित दामों पर ताज़ी सब्जियां, फल और अनाज सीधे खरीदें।",
      "contact_head": "हमसे संपर्क करें",
      "contact_sub": "क्या आपके कोई प्रश्न, सुझाव हैं या सहायता चाहिए? हमारी टीम किसानों और उपभोक्ताओं की मदद के लिए हमेशा तत्पर है।",
      "contact_email_label": "सीधा सहायता ईमेल",
      "team_label": "हैकथॉन टीम",

      // Auth Page
      "auth_title_signin": "वापसी पर स्वागत है",
      "auth_title_signup": "नया खाता बनाएं",
      "auth_sub_signin": "किसानसेतु जारी रखने के लिए साइन इन करें",
      "auth_sub_signup": "किसान या उपभोक्ता के रूप में किसानसेतु से जुड़ें",
      "label_name": "पूरा नाम",
      "label_email": "ईमेल",
      "label_password": "पासवर्ड",
      "label_i_am": "मैं एक...",
      "role_farmer": "किसान",
      "role_consumer": "उपभोक्ता",
      "placeholder_name": "आपका पूरा नाम",
      "placeholder_email": "your@email.com",
      "placeholder_password": "न्यूनतम 6 अक्षर",
      "btn_signin": "साइन इन करें",
      "btn_signup": "खाता बनाएं",
      "or_divider": "या इसके साथ जारी रखें",
      "btn_google": "Google से साइन इन करें",
      "google_role_hint": "Google साइन-अप के लिए अपनी भूमिका चुनें:",

      // Farmer Tabs & Headers
      "tab_products": "उत्पाद",
      "tab_revenue": "कमाई",
      "tab_stock": "स्टॉक",
      "tab_delivery": "डिलीवरी",
      "tab_chat": "चैट",
      "tab_profile": "प्रोफाइल",
      "head_products_title": "आपके उत्पाद",
      "head_products_sub": "फसलें जोड़ें, कीमतें बदलें और बिका हुआ माल हटाएं।",
      "head_revenue_title": "राजस्व और लागत",
      "head_revenue_sub": "अपनी कुल कमाई और मुनाफे पर नज़र रखें।",
      "head_stock_title": "स्टॉक प्रबंधन",
      "head_stock_sub": "अपनी फसल इन्वेंट्री को अपडेट रखें।",
      "head_delivery_title": "डिलीवरी सेटिंग्स",
      "head_delivery_sub": "अपनी उपलब्धता और डिलीवरी नोट प्रबंधित करें।",
      "head_chat_title": "चैट और अनुरोध",
      "head_chat_sub": "उपभोक्ताओं और साथी किसानों से जुड़ें और बात करें।",
      "head_profile_title": "आपकी प्रोफाइल",
      "head_profile_sub": "अपनी व्यक्तिगत जानकारी और स्थान अपडेट करें।",

      // Farmer Modals & Forms
      "btn_add_crop": "+ फसल जोड़ें",
      "modal_title_add": "फसल जोड़ें",
      "modal_title_edit": "फसल संपादित करें",
      "field_crop_name": "फसल का नाम",
      "placeholder_crop_name": "जैसे: हापुस आम, भिंडी",
      "field_category": "श्रेणी",
      "field_unit": "इकाई",
      "field_price": "आपकी कीमत (₹)",
      "field_cost": "लागत मूल्य (₹)",
      "field_stock": "उपलब्ध स्टॉक",
      "field_crop_photo": "फसल का फोटो (वैकल्पिक)",
      "btn_save_crop": "फसल सुरक्षित करें",
      "btn_cancel": "रद्द करें",
      "btn_save": "सहेजें",
      "btn_edit": "संपादित करें",
      "btn_delete": "हटाएं",

      // Categories & Units
      "cat_vegetable": "सब्जी",
      "cat_fruit": "फल",
      "cat_grain": "अनाज",
      "cat_spice": "मसाले",
      "cat_dairy": "डेयरी",
      "unit_kg": "किग्रा",
      "unit_pc": "नग",
      "unit_dozen": "दर्जन",
      "unit_litre": "लीटर",

      // Stats
      "stat_in_stock": "स्टॉक में है",
      "stat_out_stock": "स्टॉक समाप्त",
      "stat_low_stock": "कम स्टॉक",
      "stat_total_crops": "कुल फसलें",
      "stat_rev_potential": "संभावित राजस्व",
      "stat_total_cost": "कुल लागत",
      "stat_est_margin": "अनुमानित मुनाफा",
      "per_crop_margin": "प्रति फसल मुनाफा",
      "profit": "लाभ",
      "price": "कीमत",
      "cost": "लागत",

      // Delivery
      "delivery_status": "डिलीवरी स्थिति",
      "status_available": "डिलीवरी के लिए उपलब्ध",
      "status_out": "अभी डिलीवरी पर रवाना",
      "status_off": "आज डिलीवरी बंद है",
      "delivery_note": "डिलीवरी नोट",
      "save_delivery_btn": "डिलीवरी सेटिंग्स सहेजें",

      // Chat & Search
      "search_users_title": "उपयोगकर्ता खोजें",
      "search_placeholder_farmer": "नाम से खरीदार या किसान खोजें...",
      "btn_search": "खोजें",
      "btn_send_request": "अनुरोध भेजें",
      "pending_requests": "लंबित अनुरोध",
      "active_convs": "सक्रिय बातचीत",
      "no_pending_req": "कोई लंबित अनुरोध नहीं है।",
      "no_active_conv": "कोई सक्रिय बातचीत नहीं है।",
      "btn_accept": "स्वीकारें",
      "btn_decline": "अस्वीकार करें",
      "chat_placeholder": "संदेश टाइप करें…",
      "btn_send": "भेजें",

      // Profile
      "change_photo": "बदलें",
      "profile_phone": "फोन नंबर",
      "profile_address": "पता / गांव",
      "profile_city": "शहर / कस्बा",
      "profile_state": "राज्य",
      "location_title": "स्थान निर्देशांक (GPS)",
      "btn_location": "📍 वर्तमान स्थान का उपयोग करें",
      "btn_save_profile": "प्रोफाइल सहेजें",

      // Consumer Dashboard
      "tab_browse": "उत्पाद देखें",
      "tab_nearby": "आस-पास के किसान",
      "tab_cart": "कार्ट",
      "search_crops_placeholder": "फसलें, किसान खोजें...",
      "btn_add_to_cart": "कार्ट में जोड़ें",
      "btn_chat_farmer": "💬 चैट",
      "cart_title": "आपकी कार्ट",
      "cart_empty": "आपकी कार्ट खाली है।",
      "cart_total": "कुल राशि:",
      "btn_place_order": "ऑर्डर दें",
      "nearby_title": "आस-पास के किसान",
      "nearby_sub": "अपने वर्तमान स्थान के पास सत्यापित किसान खोजें।",
      "btn_find_nearby": "📍 मेरे पास के किसान खोजें",
      "no_farmers_found": "आस-पास कोई किसान नहीं मिला।",
      "loading": "लोड हो रहा है...",
      "loading_products": "उत्पाद लोड हो रहे हैं...",
      "no_products_found": "कोई उत्पाद नहीं मिला।",
      "verified_farmer": "सत्यापित किसान",
      "delivery_note_placeholder": "जैसे: 5 किमी के भीतर मुफ्त डिलीवरी, शाम 6 बजे के बाद अगले दिन",
      "no_users_found": "कोई उपयोगकर्ता नहीं मिला।",
      "searching": "खोज रहे हैं...",
      "sent_req_text": "ने अनुरोध भेजा",
      "you_requested_chat": "आपने बातचीत का अनुरोध भेजा:",
      "stat_pending": "लंबित",
      "getting_location": "स्थान प्राप्त कर रहे हैं...",
      "searching_nearby": "आस-पास के किसानों को खोज रहे हैं...",
      "delivery_address_label": "डिलीवरी का पता",
      "profile_sub_consumer": "आस-पास के किसानों को खोजने और सीधे चैट करने के लिए अपना नाम और स्थान सेट करें।",
      "profile_sub_farmer": "अपना पूरा नाम और खेत का विवरण सेट करें ताकि खरीदार आपको खोज सकें और संपर्क कर सकें।",
      "online": "ऑनलाइन",
      "added_to_cart": "कार्ट में जोड़ा गया!",
      "btn_checkout": "ऑर्डर दें",
      "order_success": "ऑर्डर सफलतापूर्वक दर्ज किया गया! 🎉",
      "chat_req_sent": "चैट अनुरोध भेजा गया!",
      "save_profile_success": "प्रोफाइल सफलतापूर्वक सहेजी गई! 🎉"
    },

    mr: {
      // Brand & Navigation
      "brand_name": "किसानसेतू",
      "tagline": "शेत ते ताट थेट बाजारपेठ",
      "for_farmers": "शेतकऱ्यांसाठी",
      "for_buyers": "ग्राहकांसाठी",
      "about": "आमच्याबद्दल",
      "contact": "संपर्क साधा",
      "sign_in": "साइन इन",
      "sign_up": "नोंदणी करा",
      "sign_out": "🚪 बाहेर पडा",
      "switch_to_farmer": "🧑‍🌾 शेतकरी बना",
      "switch_to_buyer": "🛒 ग्राहक बना",
      "back_to_home": "← किसानसेतू मुख्यपृष्ठावर जा",
      "dev_by": "निर्माते",

      // Landing Page
      "hero_title": "थेट मातीतून तुमच्या ताटात",
      "hero_sub": "भारतीय शेतकऱ्यांना थेट ग्राहकांशी जोडणारा सेतू. ताजी पिके, रास्त भाव आणि शून्य दलाल.",
      "farmer_card_title": "मी शेतकरी आहे",
      "farmer_card_desc": "आपली ताजी पिके जोडा, स्वतः भाव ठरवा, नफा तपासा आणि थेट स्थानिक ग्राहकांशी संपर्क साधा.",
      "buyer_card_title": "मी खरेदीदार आहे",
      "buyer_card_desc": "स्थानिक सत्यापित शेतकऱ्यांकडून थेट रास्त दरात ताजी फळे, भाजीपाला आणि धान्य खरेदी करा.",
      "contact_head": "आमच्याशी संपर्क साधा",
      "contact_sub": "काही प्रश्न, सूचना किंवा मदतीची गरज आहे? शेतकरी आणि ग्राहकांच्या सेवेसाठी आमची टीम सदैव तत्पर आहे.",
      "contact_email_label": "थेट संपर्क ईमेल",
      "team_label": "हॅकाथॉन टीम",

      // Auth Page
      "auth_title_signin": "पुन्हा स्वागत आहे",
      "auth_title_signup": "नवीन खाते तयार करा",
      "auth_sub_signin": "किसानसेतू सुरू ठेवण्यासाठी साइन इन करा",
      "auth_sub_signup": "शेतकरी किंवा ग्राहक म्हणून किसानसेतूमध्ये सामील व्हा",
      "label_name": "पूर्ण नाव",
      "label_email": "ईमेल",
      "label_password": "पासवर्ड",
      "label_i_am": "मी एक...",
      "role_farmer": "शेतकरी",
      "role_consumer": "ग्राहक",
      "placeholder_name": "तुमचे पूर्ण नाव",
      "placeholder_email": "your@email.com",
      "placeholder_password": "किमान ६ अक्षरे",
      "btn_signin": "साइन इन करा",
      "btn_signup": "खाते तयार करा",
      "or_divider": "किंवा यासह सुरू ठेवा",
      "btn_google": "Google ने साइन इन करा",
      "google_role_hint": "Google साइन-अपसाठी तुमची भूमिका निवडा:",

      // Farmer Tabs & Headers
      "tab_products": "उत्पादने",
      "tab_revenue": "महसूल व नफा",
      "tab_stock": "साठा व्यवस्थापन",
      "tab_delivery": "डिलिव्हरी",
      "tab_chat": "गप्पा व विनंत्या",
      "tab_profile": "माझी माहिती",
      "head_products_title": "तुमची उत्पादने",
      "head_products_sub": "नवीन पिके जोडा, भाव बदला आणि विकलेली उत्पादने व्यवस्थापित करा.",
      "head_revenue_title": "महसूल व खर्च",
      "head_revenue_sub": "तुमची एकूण कमाई आणि नफ्याचे प्रमाण तपासा.",
      "head_stock_title": "साठा व्यवस्थापन",
      "head_stock_sub": "तुमचा उपलब्ध साठा अद्ययावत ठेवा.",
      "head_delivery_title": "डिलिव्हरी पर्याय",
      "head_delivery_sub": "तुमची उपलब्धता आणि डिलिव्हरी सूचना व्यवस्थापित करा.",
      "head_chat_title": "गप्पा व विनंत्या",
      "head_chat_sub": "ग्राहक आणि इतर शेतकऱ्यांशी थेट संवाद साधा.",
      "head_profile_title": "तुमची प्रोफाइल",
      "head_profile_sub": "तुमची वैयक्तिक माहिती आणि शेताचा पत्ता अद्ययावत करा.",

      // Farmer Modals & Forms
      "btn_add_crop": "+ नवीन पीक जोडा",
      "modal_title_add": "नवीन पीक जोडा",
      "modal_title_edit": "पीक संपादित करा",
      "field_crop_name": "पिकाचे नाव",
      "placeholder_crop_name": "उदा. हापूस आंबा, भेंडी",
      "field_category": "प्रवर्ग",
      "field_unit": "एकक",
      "field_price": "तुमचा भाव (₹)",
      "field_cost": "उत्पादन खर्च (₹)",
      "field_stock": "उपलब्ध साठा",
      "field_crop_photo": "पिकाचा फोटो (पर्यायी)",
      "btn_save_crop": "पीक जतन करा",
      "btn_cancel": "रद्द करा",
      "btn_save": "जतन करा",
      "btn_edit": "संपादित करा",
      "btn_delete": "हटवा",

      // Categories & Units
      "cat_vegetable": "भाजीपाला",
      "cat_fruit": "फळे",
      "cat_grain": "धान्य",
      "cat_spice": "मसाले",
      "cat_dairy": "दुग्धजन्य",
      "unit_kg": "किलो",
      "unit_pc": "नग",
      "unit_dozen": "डझन",
      "unit_litre": "लिटर",

      // Stats
      "stat_in_stock": "साठ्यात उपलब्ध",
      "stat_out_stock": "साठा संपला",
      "stat_low_stock": "कमी साठा",
      "stat_total_crops": "एकूण पिके",
      "stat_rev_potential": "संभाव्य महसूल",
      "stat_total_cost": "एकूण खर्च",
      "stat_est_margin": "अंदाजे नफा",
      "per_crop_margin": "प्रति पीक नफा",
      "profit": "नफा",
      "price": "भाव",
      "cost": "खर्च",

      // Delivery
      "delivery_status": "डिलिव्हरी स्थिती",
      "status_available": "डिलिव्हरीसाठी उपलब्ध",
      "status_out": "सध्या डिलिव्हरीसाठी बाहेर",
      "status_off": "आज डिलिव्हरी बंद आहे",
      "delivery_note": "डिलिव्हरी सूचना",
      "save_delivery_btn": "डिलिव्हरी पर्याय जतन करा",

      // Chat & Search
      "search_users_title": "वापरकर्ते शोधा",
      "search_placeholder_farmer": "नावाने ग्राहक किंवा शेतकरी शोधा...",
      "btn_search": "शोधा",
      "btn_send_request": "विनंती पाठवा",
      "pending_requests": "प्रलंबित विनंत्या",
      "active_convs": "सक्रिय संभाषणे",
      "no_pending_req": "कोणतीही प्रलंबित विनंती नाही.",
      "no_active_conv": "कोणतेही सक्रिय संभाषण नाही.",
      "btn_accept": "स्वीकारा",
      "btn_decline": "नाकारा",
      "chat_placeholder": "संदेश टाईप करा…",
      "btn_send": "पाठवा",

      // Profile
      "change_photo": "बदला",
      "profile_phone": "फोन नंबर",
      "profile_address": "पत्ता / गाव",
      "profile_city": "शहर / तालुका",
      "profile_state": "राज्य",
      "location_title": "स्थान निर्देशांक (GPS)",
      "btn_location": "📍 चालू स्थान वापरा",
      "btn_save_profile": "प्रोफाइल जतन करा",

      // Consumer Dashboard
      "tab_browse": "पहा",
      "tab_nearby": "जवळपास",
      "tab_cart": "टोपली",
      "search_crops_placeholder": "पिके, शेतकरी शोधा...",
      "btn_add_to_cart": "टोपलीत जोडा",
      "btn_chat_farmer": "💬 गप्पा",
      "cart_title": "तुमची खरेदी टोपली",
      "cart_empty": "तुमची खरेदी टोपली रिकामी आहे.",
      "cart_total": "एकूण रक्कम:",
      "btn_place_order": "ऑर्डर करा",
      "nearby_title": "जवळपासचे शेतकरी",
      "nearby_sub": "तुमच्या ठिकाणाजवळील सत्यापित शेतकरी शोधा.",
      "btn_find_nearby": "📍 माझ्याजवळील शेतकरी शोधा",
      "no_farmers_found": "जवळपास कोणताही शेतकरी आढळला नाही.",
      "loading": "लोड होत आहे...",
      "loading_products": "उत्पादने लोड होत आहेत...",
      "no_products_found": "कोणतीही उत्पादने आढळली नाहीत.",
      "verified_farmer": "सत्यापित शेतकरी",
      "delivery_note_placeholder": "उदा. ५ किमीच्या आत मोफत डिलिव्हरी, संध्याकाळी ६ नंतर पुढील दिवशी",
      "no_users_found": "कोणताही वापरकर्ता आढळला नाही.",
      "searching": "शोधत आहे...",
      "sent_req_text": "यांनी विनंती पाठवली",
      "you_requested_chat": "तुम्ही संभाषणासाठी विनंती पाठवली:",
      "stat_pending": "प्रलंबित",
      "getting_location": "चालू स्थान मिळवत आहे...",
      "searching_nearby": "जवळपासच्या शेतकऱ्यांना शोधत आहे...",
      "delivery_address_label": "डिलिव्हरीचा पत्ता",
      "profile_sub_consumer": "जवळपासचे शेतकरी शोधण्यासाठी आणि थेट संवाद साधण्यासाठी तुमचे नाव आणि पत्ता नोंदवा.",
      "profile_sub_farmer": "तुमचे पूर्ण नाव आणि शेतीचा पत्ता नोंदवा जेणेकरून ग्राहक तुमच्याशी संपर्क साधू शकतील.",
      "online": "ऑनलाइन",
      "added_to_cart": "खरेदी टोपलीत जोडले!",
      "btn_checkout": "ऑर्डर करा",
      "order_success": "ऑर्डर यशस्वीरीत्या नोंदवली गेली! 🎉",
      "chat_req_sent": "चॅट विनंती पाठवली!",
      "save_profile_success": "प्रोफाइल यशस्वीरीत्या जतन केली! 🎉"
    }
  };

  let currentLang = localStorage.getItem('ks_lang') || 'en';

  function t(key, defaultText) {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    if (dict && dict[key]) return dict[key];
    if (TRANSLATIONS.en && TRANSLATIONS.en[key]) return TRANSLATIONS.en[key];
    return defaultText || key;
  }

  function setLanguage(lang) {
    if (!TRANSLATIONS[lang]) lang = 'en';
    currentLang = lang;
    localStorage.setItem('ks_lang', lang);
    translatePage();
    updateSelectorUI();
    window.dispatchEvent(new CustomEvent('ks_language_changed', { detail: { lang } }));
  }

  function getLanguage() {
    return currentLang;
  }

  function translatePage() {
    // 1. Text elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = t(key);
      if (val) {
        // preserve icon span if present
        const ic = el.querySelector('.ic');
        if (ic) {
          el.innerHTML = '';
          el.appendChild(ic);
          el.appendChild(document.createTextNode(val));
        } else {
          el.textContent = val;
        }
      }
    });

    // 2. Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = t(key);
      if (val) el.setAttribute('placeholder', val);
    });

    // 3. Titles / tooltips
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const val = t(key);
      if (val) el.setAttribute('title', val);
    });
  }

  function updateSelectorUI() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      if (btn.dataset.lang === currentLang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    document.querySelectorAll('.ks-lang-select').forEach(sel => {
      sel.value = currentLang;
    });
  }

  // Helper to create language selector HTML
  function getSelectorHTML() {
    return `
      <div class="ks-lang-picker" title="Change Language">
        <button type="button" class="lang-btn ${currentLang==='en'?'active':''}" onclick="KS_I18N.setLanguage('en')">EN</button>
        <button type="button" class="lang-btn ${currentLang==='hi'?'active':''}" onclick="KS_I18N.setLanguage('hi')">हिंदी</button>
        <button type="button" class="lang-btn ${currentLang==='mr'?'active':''}" onclick="KS_I18N.setLanguage('mr')">मराठी</button>
      </div>
    `;
  }

  window.KS_I18N = {
    t,
    setLanguage,
    getLanguage,
    translatePage,
    getSelectorHTML,
    TRANSLATIONS
  };

  // Auto initialize on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    translatePage();
    updateSelectorUI();
  });
})();
