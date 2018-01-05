// messages
var APP_MESSAGES = {
    err_finding_account: "خطأ في العثور على حساب المستخدم",
    err_old_password_wrong: "كلمة المرور القديمة غير صحيحة",
    password_changed: "تم تغيير كلمة المرور",
    account_not_exist: "هذا الحساب غير موجود",
    user_not_found: "لم يتم العثور على المستخدم",
    account_not_activated: "حسابك غير مفعل",
	account_delete: "تم حذف حسابك، يرجى الاتصال بالمشرف",
	provider_delete:"تم حذف حساب موفر الخدمة",
	provider_inactive : "تم تعطيل حساب موفر الخدمة",
	customer_delete : "تم حذف حساب العميل.",
	customer_inactive : "تم تعطيل حساب العميل.",
    profile_updated_sucessfully:"تم تحديث ملفك الشخصي",
    error_finding_user:"خطأ في العثور على حساب المستخدم",
    email_not_registered:"هذا البريد الإلكتروني غير مسجل",
    email_already_registered:"البريد الإلكتروني مسجل من قبل",
    email_registered_fb:"تم تسجيل بريدك الإلكتروني مع فيسبوك",
    email_registered_google:"تم تسجيل بريدك الإلكتروني مع جوجل",
    password_reset_no_mail:"لقد وضعنا كلمة مرور مؤقتة ولكننا لم نتمكن من إرسالها إلى عنوان بريدك الإلكتروني",
    password_reset_with_mail:"تم إرسال كلمة المرور المؤقتة إلى عنوان بريدك الإلكتروني",
    logout_msg:"تم تسجيل خروجك من التطبيق",
    invalid_invitation_code: "رمز الدعوة المدخل غير صالح",
    registered_successfully: "تم تسجيل الدخول بنجاح",
    mobile_already_registered: "رقم الجوال مسجل من قبل",
    wrong_old_password:"كلمة المرور القديمة غير صحيحة",
    profile_found: "تم العثور على ملفك الشخصي",
    invalid_social_details: "معلومات التواصل الإجتماعي غير",
    language_updated: "تم تحديث اللغة بنجاح",
    notification_status_updated:"تم تحديث حالة الإشعارات بنجاح",
    no_payment_detail_found: "لم يتم العثور على تفاصيل الدفعات للمستخدم",

    incorrect_email_password: "بريد إلكتروني غير صالح أو باسورود",


    // service messages

    new_order: "تم وضع طلب جديد بنجاح",
    something_went_wrong: "هناك خطأ ما",
    promo_found_successfully: "تم العثور على الرمز الترويجي بنجاح",
    orders_found_successfully:"تم العثور على الطلبات بنجاح",
    order_found_successfully:"تم العثور على الطلب بنجاح",
    order_already_withdrawn:"لقد تم سحب هذا الطلب من قبل",
    err_cannot_withdraw:"طلبك قيد التنفيذ، لا يمكن سحب الطلب في هذه المرحلة",
    err_cannot_update:"طلبك قيد التنفيذ، لا يمكن تحديث الطلب في هذه المرحلة",
    order_withdrawn_successfully:"تم سحب الطلب",
    order_permission_err: "هذا الطلب غير موجود أو لا يسمح بتحديث هذا السجل",
    order_updated: "تم تحديث الطلب",
    cannot_rate_early:"لم يتم الانتهاء طلبك لا يمكن أن تقيم في هذه المرحلة",
    provider_rated:"لقد نجحت في تقييم مقدم الخدمة",
    order_detail_success:"تم أخذ تفاصيل الطلب بنجاح",
    notifications_found:"تم العثور على الإشعار بنجاح",
    notifications_not_found:"لم يتم العثور على الإشعار ",
    order_cancelled_by_customer:"تم إلغاء الطلب من قبل العميل",
    cannot_accept_order:"لقد تم قبول أو رفض هذا الطلب من قبل. لا يمكن القبول في هذه المرحلة",
    order_accepted: "تم قبول الطلب",
    order_declined: "تم رفض الطلب بنجاح",
    price_list_found: "تم العثور على قائمة الأسعار بنجاح",
    order_complete:"تم إنهاء الطلب",
    order_cannot_complete:"لم نتمكن من إنهاء هذا الطلب. الرجاء المحاولة من جديد.",
    order_history_found:"تم العثور على الطلبات المنتهية بنجاح",
    mark_delivery_first:"لا يمكنك إكمال هذا الطلب، يرجى وضع علامة للتسليم أولا",
    order_ready_for_delivery:"الطلب خرج للتوصيل",
    order_not_ready:"هذا الطلب غير جاهز للتوصيل. لا يمكن توصيل هذا الطلب.",
    order_updated:"تم تحديث تفاصيل الطلب",
    order_not_confirmed:"هذا الطلب غير مؤكد من قبلك. لا يمكنك إضافة تفاصيل في هذه المرحلة",


    order_already_complete: "لقد تم إنهاء هذا الطلب من قبل",
    cant_update_pickup_now: "لا يمكن تحديث وقت الإستلام الآن. الرجاء مراجعة سياسة التعديل.",
    cant_update_delivery_now: "لا يمكن تحديث وقت التوصيل الآن. الرجاء مراجعة سياسة التعديل.",


    already_dispute:"لقد أثارت نزاعا بشأن هذا الطلب",
    raised_dispute:"أثار النزاع بنجاح",
    no_provider_available:"لا مزود بالقرب منك هو متاح للوقت واليوم الذي تختاره",
    location_not_covered:"لا يغطي هذا الموقع حاليا كلانلين، يرجى مراسلتنا على البريد الإلكتروني على support@cleanlineapp.com ونحن سوف ننظر بالتأكيد في هذا. نحن نقدر دعمكم وآسف لأي إزعاج",
    invalid_pickup_time:"لا يمكن إنشاء النظام لوقت بيك آب معين"



    
};

module.exports.APP_MESSAGES = APP_MESSAGES;
