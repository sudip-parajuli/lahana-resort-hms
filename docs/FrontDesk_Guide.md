# Lahana Resort PMS — Front Desk Operations Guide
## (फ्रन्ट डेस्क सञ्चालन निर्देशिका)

Welcome to the Lahana Resort Property Management System (PMS). This guide provides step-by-step instructions for front desk receptionists to manage bookings, check guests in and out, process payments, and resolve common issues.

---

## 1. Daily Startup & Login (सुरुवात र लग-इन)

### English:
1. Open Google Chrome on the reception PC.
2. Navigate to: `https://pms.lahanaresort.com` (or `http://lahana.localhost:3000` for testing).
3. Enter your assigned email: `receptionist@lahana.com`.
4. Enter the password: `LahanaPassword123!` (or the updated password provided by your manager).
5. Click **Sign In**. You will land on the **Daily Operations Dashboard**.

### नेपाली:
१. रिसेप्सन पीसी (PC) मा गुगल क्रोम (Google Chrome) खोल्नुहोस्।
२. `https://pms.lahanaresort.com` मा जानुहोस्।
३. आफ्नो ईमेल राख्नुहोस्: `receptionist@lahana.com`
४. पासवर्ड राख्नुहोस्: `LahanaPassword123!` (अथवा म्यानेजरले दिएको नयाँ पासवर्ड)।
५. **Sign In** मा क्लिक गर्नुहोस्। तपाईं **Daily Operations Dashboard** (मुख्य सञ्चालन बोर्ड) मा पुग्नुहुनेछ।

---

## 2. Today's Dashboard Overview (मुख्य सञ्चालन बोर्ड विवरण)

The dashboard gives you a live overview of today's activities:
- **Occupancy Rate (कोठा ओगटिएको प्रतिशत)**: Percentage of active rooms. Keep an eye on this to know room availability.
- **Expected Arrivals (आगमन हुने पाहुनाहरू)**: List of guests checking in today.
- **Expected Departures (प्रस्थान गर्ने पाहुनाहरू)**: List of guests scheduled to check out today.
- **Live Room Grid (कोठाको स्थिति)**: A color-coded view of all rooms:
  - **Green (हरियो)**: Available (खाली / बस्न मिल्ने)
  - **Red (रातो)**: Occupied (पाहुना भएको)
  - **Amber (पहेंलो)**: Dirty (सफा गर्नुपर्ने)
  - **Grey (खैरो)**: Out of Order / Maintenance (मर्मत कार्य भइरहेको)

---

## 3. Step-by-Step Guest Check-In (पाहुना चेक-इन गर्ने तरिका)

### English:
For guests who already have a reservation:
1. Go to the **Expected Arrivals** section on the dashboard or navigate to the **Front Desk** page from the sidebar.
2. Find the guest's name in the arrivals list.
3. Click the **Check-In** button.
4. Verify the guest's information (Name, Phone, Stay dates, Room number).
5. Verify if any advance deposit was paid. If yes, it will be marked as "Advance Deposit Paid".
6. Ask the guest for identification (e.g. Passport/Citizenship), take a photo/scan, and enter their details.
7. Click **Confirm Check-In**. The room status will automatically change to **Red (Occupied)**.
8. Hand over the room key.

### नेपाली:
पहिले नै बुकिङ गरिसकेका पाहुनाहरूको लागि:
१. मुख्य बोर्डको **Expected Arrivals** मा जानुहोस् वा साइडबारबाट **Front Desk** पेजमा क्लिक गर्नुहोस्।
२. पाहुनाको नाम खोज्नुहोस् र **Check-In** मा क्लिक गर्नुहोस्।
३. विवरणहरू रुजु गर्नुहोस् (नाम, फोन, बस्ने मिति, कोठा नम्बर)।
४. बैना रकम (Advance Deposit) तिरेको छ कि छैन जाँच गर्नुहोस्।
५. पाहुनाको परिचय पत्र (नागरिकता/पासपोर्ट) को विवरण थप्नुहोस्।
६. **Confirm Check-In** मा क्लिक गर्नुहोस्। कोठाको रङ स्वचालित रूपमा **रातो (Occupied)** हुनेछ।
७. पाहुनालाई साँचो हस्तान्तरण गर्नुहोस्।

---

## 4. Walk-In Booking (तत्काल आउने पाहुनाको बुकिङ)

### English:
If a guest arrives without a prior reservation:
1. Navigate to **Bookings** -> **New Booking** from the sidebar.
2. Select the Check-In and Check-Out dates.
3. Choose the room type and check room availability.
4. Select an available room number.
5. Fill in the Guest Details: First Name, Last Name, Phone, and Email.
6. Under **Step 3: Billing**, specify if they are paying a deposit or full amount now.
7. Click **Create Booking**.
8. Go to the **Front Desk** page and check them in immediately using the steps in Section 3.

### नेपाली:
पहिल्यै बुकिङ नगरी आएका पाहुनाहरूको बुकिङका लागि:
१. साइडबारबाट **Bookings** -> **New Booking** मा जानुहोस्।
२. पाहुना बस्ने र जाने मितिहरू छान्नुहोस्।
३. कोठाको प्रकार छानेर खाली कोठाहरू जाँच गर्नुहोस् र कोठा नम्बर रोज्नुहोस्।
४. पाहुनाको विवरण (नाम, फोन, ईमेल) भर्नुहोस्।
५. **Step 3: Billing** मा गएर जम्मा भुक्तानी वा बैना रकमको छनौट गर्नुहोस्।
६. **Create Booking** मा क्लिक गर्नुहोस्।
७. अब **Front Desk** पेजमा गएर माथि खण्ड ३ को प्रक्रिया अनुसार चेक-इन गर्नुहोस्।

---

## 5. Guest Check-Out & Settle Bill (पाहुना चेक-आउट र बिल भुक्तानी)

### English:
1. Go to the **Front Desk** page and click the **Check-Out** button next to the guest's name.
2. The **Check Out Modal** will open.
3. Review stay details and charges:
   - **Room Stay Charges** (calculated automatically).
   - **Additional Charges**: Click **+ Add Charge** to log extra charges (e.g. Laundry, Minibar, Room Damage) with their amount.
4. Review the **Advance Deposit Paid** (already deducted from the total).
5. Under **Settlement Payment Gateway**, select the payment method:
   - **Cash**: Settle using cash NPR.
   - **Credit/Debit Card**: Settle using the card machine.
   - **eSewa / Khalti / Fonepay**: Ask the guest to scan the QR code or transfer to the resort account.
   - **Split Payment**: Use this if a group wants to pay using multiple cards/methods or separate bills.
6. **Processing a Split Payment**:
   - Select **Split Payment (Group/Multiple)**.
   - Click **+ Add Allocation** to create rows for each payment.
   - For each split row, specify the payment method, amount, reference number, and description (e.g. "Guest A - Card", "Guest B - eSewa").
   - Ensure the *Total Allocated* matches the *Remaining Balance* exactly (a green indicator will show it is valid).
7. Ask the guest for rating and comments, then type them in.
8. Click **Settle Bill & Check Out**. The system will save the invoice and mark the room as **Amber (Dirty)**.

### नेपाली:
१. **Front Desk** पेजमा जानुहोस् र पाहुनाको नामको छेउमा रहेको **Check-Out** बटनमा क्लिक गर्नुहोस्।
२. चेक-आउट पप-अप (Check Out Modal) खुल्नेछ।
३. कोठा र अन्य सेवाहरूको शुल्कहरू पुनरावलोकन गर्नुहोस्:
   - थप शुल्कहरू (जस्तै: लुगा धुने, मिनीबार) जोड्न **+ Add Charge** मा क्लिक गरी रकम भर्नुहोस्।
४. पाहुनाले पहिले बुझाएको बैना रकम (Advance Deposit) स्वतः घटाइएको हुनेछ।
५. भुक्तानी गर्ने तरिका (Payment Gateway) रोज्नुहोस्:
   - **Cash (नगद)**, **Card (कार्ड)**, वा **eSewa / Khalti / Fonepay (QR स्क्यान)**।
   - यदि समूहमा रहेका पाहुनाहरूले छुट्टाछुट्टै बिल तिर्न चाहेमा **Split Payment** रोज्नुहोस्।
६. **Split Payment (बिल बाँडफाँड) गर्ने तरिका**:
   - **Split Payment** रोजेपछि **+ Add Allocation** मा क्लिक गर्नुहोस्।
   - प्रत्येक पाहुनाको भागमा पर्ने रकम, भुक्तानीको प्रकार र विवरण (जस्तै: "Guest A - Card") भर्नुहोस्।
   - सबैको रकम जोड्दा बाँकी रहेको कुल बिल रकमसँग ठ्याक्कै मिल्नुपर्छ (मिल्दा हरियो सङ्केत देखिनेछ)।
७. पाहुनाको सन्तुष्टि रेटिङ र सल्लाह-सुझाव लेख्नुहोस्।
८. **Settle Bill & Check Out** मा क्लिक गर्नुहोस्। बिल सुरक्षित हुनेछ र कोठा सफा गर्नुपर्ने स्थिति **पहेंलो (Dirty)** मा परिणत हुनेछ।

---

## 6. Public Booking Widget Sync (वेबसाइट बुकिङ सिङ्क)

### English:
Bookings made by guests on the resort website (`https://lahanaresort.com`) flow into the PMS automatically.
- When a new booking is made online, you will receive an email and the reservation will appear on your **Dashboard** and **Bookings Calendar** instantly.
- The guest will have already paid the required **Advance Deposit (30%)** online via eSewa or Khalti.
- Double-check the **Bookings** page daily to review incoming online reservations.

### नेपाली:
वेबसाइट (`https://lahanaresort.com`) बाट पाहुनाले गरेको बुकिङहरू स्वतः पीएमएस (PMS) मा देखा पर्दछन्:
- नयाँ बुकिङ हुनासाथ तपाईंलाई इमेल आउनेछ र मुख्य बोर्डमा बुकिङ सूची थपिनेछ।
- पाहुनाले अनलाइन बुकिङ गर्दा नै ३०% बैना रकम eSewa वा Khalti मार्फत बुझाइसकेका हुनेछन्।
- दैनिक रूपमा नयाँ अनलाइन बुकिङहरू जाँच गर्न **Bookings** पेज नियमित हेर्नुहोस्।

---

## 7. Support & Troubleshooting (सपोर्ट र समस्या निवारण)

If you encounter issues:
- **Unable to login**: Check that you are connected to the internet. Verify spelling of email/password.
- **Key card error**: Verify room assignment on the room status grid.
- **Support Contact**: Contact Sudip Parajuli on WhatsApp at **+977-98XXXXXXXX** for system support.
