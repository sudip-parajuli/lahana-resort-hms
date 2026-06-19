# Lahana Resort PMS — Manager & Admin Operations Guide
## (म्यानेजर तथा व्यवस्थापक निर्देशिका)

This guide provides comprehensive instructions for resort managers and system administrators to manage daily operations, track financial performance, adjust rooms/menus, process payroll, export reports, and execute database backups.

---

## 1. Daily Dashboard & Operations Control (दैनिक व्यवस्थापन बोर्ड)

### English:
1. Navigate to: `https://pms.lahanaresort.com`
2. Log in with your email: `manager@lahana.com` and password `LahanaPassword123!`.
3. The **Daily Operations Dashboard** displays:
   - **Today's Occupancy**: Active check-ins relative to total rooms.
   - **Financial Revenue**: Live revenue collected today from front desk and restaurant checkout actions.
   - **Room Status Grid**: Click on any room to manually toggle status (Available, Dirty, Maintenance, Out-of-Service).
   - **Resort Alerts**: Red alerts displaying low-stock inventory items, overdue cleaning schedules, and unresolved maintenance requests.

### नेपाली:
१. `https://pms.lahanaresort.com` मा जानुहोस्।
२. ईमेल: `manager@lahana.com` र पासवर्ड: `LahanaPassword123!` मार्फत लग-इन गर्नुहोस्।
३. **Daily Operations Dashboard** मा तपाईंले निम्न विवरण देख्नुहुनेछ:
   - **Occupancy (कोठा ओगटिएको विवरण)**: खाली र भरिएका कोठाहरूको अनुपात।
   - **Revenue (राजस्व)**: आज संकलन भएको कुल रकम (रिसेप्सन र रेष्टुरेन्ट दुवैबाट)।
   - **Room Status Grid**: कुनै पनि कोठामा क्लिक गरी सिधै स्थिति परिवर्तन गर्न सक्नुहुन्छ (सफा, फोहोर, मर्मत आदि)।
   - **Alerts (सतर्कता सन्देश)**: सामान सकिन लागेको, मर्मत बाँकी रहेको वा हाउसकिपिङ काम ढिला भएको चेतावनी सन्देशहरू।

---

## 2. Managing Room Bookings & Rates (कोठा र दर व्यवस्थापन)

### English:
- **Calendar View**: Go to **Bookings** -> **Calendar** to see a visual timeline of all reservations. Drag-and-drop bookings to change rooms or double-click to view guest bills and check-in files.
- **Adjusting Rates**: Navigate to **Rooms** -> **Room Types** or **Rate Plans**. You can edit seasonal prices (e.g. increase rates during peak seasons) or configure package options (e.g. including breakfast).
- **Advance Deposit Config**: To adjust deposit requirements, edit the Property settings. The default is set to 30% advance payment required to secure online bookings.

### नेपाली:
- **Calendar View (पात्रो विवरण)**: साइडबारबाट **Bookings** -> **Calendar** मा जानुहोस्। कोठा परिवर्तन गर्न बुकिङहरू सार्नुहोस् वा बिल हेर्न डबल-क्लिक गर्नुहोस्।
- **मूल्य परिमार्जन (Rates)**: **Rooms** -> **Room Types** वा **Rate Plans** मा गएर मौसम अनुसार कोठाको मूल्यहरू बढाउन वा घटाउन सक्नुहुन्छ।
- **बैना रकम (Deposit)**: अनलाइन बुकिङका लागि हाल ३०% बैना रकम आवश्यक पर्ने गरी मिलाइएको छ। यसलाई आवश्यक परे चेन्ज गर्न सकिन्छ।

---

## 3. Inventory & Recipe Auto-Deduction (सामान र रेसिपी व्यवस्थापन)

### English:
1. Navigate to **Inventory** from the sidebar.
2. **Item Alerts**: Items with stock below the reorder level are highlighted in red on the dashboard.
3. **Recipes**: Select restaurant menu items and bind them to inventory raw materials (e.g. a Chicken Momo order is linked to 100g Chicken, 50g Flour, etc.).
4. **Auto-Deduction**: When a waiter marks a food order as **Served**, the system automatically deducts the raw materials from the inventory database. Use this to track usage and prevent theft.

### नेपाली:
१. साइडबारबाट **Inventory** (जिन्सी) मा जानुहोस्।
२. **स्टक अलर्ट**: कुनै सामान रिअर्डर लेभल (Reorder Level) भन्दा कम भएमा मुख्य बोर्डमा रातो देखिनेछ।
३. **रेसिपी (Recipes)**: रेष्टुरेन्टको खानालाई जिन्सी सामानसँग लिंक गर्नुहोस् (जस्तै: चिकेन मःमः अर्डर हुँदा १०० ग्राम चिकेन, ५० ग्राम मैदा स्वतः घट्ने)।
४. वेटरले खाना सर्भ (Served) गर्नासाथ जिन्सी स्टक स्वतः घट्नेछ। यसले सामान हिनामिना हुनबाट रोक्छ।

---

## 4. Payroll, Attendance & Nepal SSF Compliance (तलब र सामाजिक सुरक्षा कोष)

### English:
- **Attendance**: Go to **HR** -> **Attendance** to review staff clock-in/out times. Receptionists and kitchen staff check in daily using their unique 4-digit PIN codes.
- **Filing Status & SSF Slabs**:
  - The system computes Nepalese payroll taxes based on Single/Married filing statuses.
  - Automatically calculates 11% Employee SSF contribution deduction and 20% Employer SSF contribution.
- **Generate Payslips**: Navigate to **Staff** -> **Payroll**, select the month, and click **Process Payroll**. Once finalized, click **Print Payslip** to download printable PDFs.

### नेपाली:
- **हाजिरी (Attendance)**: कर्मचारीको हाजिरी विवरण **HR** -> **Attendance** मा हेर्नुहोस्। कर्मचारीले ४ अङ्कको पिन (PIN) कोड हानेर हाजिर गर्छन्।
- **सामाजिक सुरक्षा कोष (SSF) र कर (Tax)**:
  - कर्मचारी अविवाहित (Single) वा विवाहित (Married) हो, सोही अनुसार आयकर गणना हुन्छ।
  - कर्मचारीको ११% रकम कोषमा कट्टा हुने र रोजगारदाताको तर्फबाट २०% थपिने काम स्वतः हिसाब हुन्छ।
- **तलबी सिट (Payroll)**: महिना रोजेर **Process Payroll** मा क्लिक गर्नुहोस् र तलब स्वीकृत भएपछि PDF डाउनलोड गरी प्रिन्ट गर्नुहोस्।

---

## 5. Compiling Financial Reports (वित्तीय रिपोर्ट र भ्याट खाता)

### English:
1. Navigate to **Analytics** -> **Reports** from the sidebar.
2. Select the report type:
   - **Daily Revenue Report**: Complete payment settlements summary.
   - **Occupancy Analysis**: Room sales metrics.
   - **Nepal Tax / VAT Sales Register**: Standard IRD-compliant sales book for tax filing.
3. Select the Start Date and End Date.
4. Choose the format: **PDF Document (.pdf)** or **Spreadsheet (.xlsx)**.
5. Click **Compile Document**.
6. The report compiles in the background using Celery workers. Once status is **Ready**, click **Get File** to download.

### नेपाली:
१. साइडबारबाट **Analytics** -> **Reports** मा जानुहोस्।
२. रिपोर्टको प्रकार छान्नुहोस्:
   - **Daily Revenue**: दैनिक संकलित रकम।
   - **Nepal Tax / VAT Sales Register**: आन्तरिक राजस्व विभाग (IRD) मा बुझाउन मिल्ने भ्याट बिक्री खाता।
३. सुरु र अन्तिम मिति रोज्नुहोस्।
४. ढाँचा रोज्नुहोस्: **PDF** वा **Excel (Spreadsheet)** र **Compile Document** मा थिच्नुहोस्।
५. ब्याकग्राउन्डमा फाइल तयार भएपछि **Get File** मा थिचेर सुरक्षित गर्नुहोस्।

---

## 6. System Backups (डाटाबेस ब्याकअप गर्ने तरिका)

### English:
The system is configured to perform daily automated backups at 3:00 AM Nepal Time.
To manually perform a database backup at any time:
1. SSH into the VPS server as root:
   `ssh root@pms.lahanaresort.com`
2. Run the backup command:
   `bash /opt/lahana-resort-hms/scripts/backup.sh`
3. Backups are stored safely on the host VPS at `/backups/`. We recommend downloading copies weekly to an offsite device.

### नेपाली:
प्रणालीमा हरेक दिन बिहान ३:०० बजे स्वतः ब्याकअप हुने गरी मिलाइएको छ।
कुनै पनि समयमा म्यानुअल ब्याकअप गर्नका लागि:
१. सर्भरमा लग-इन गर्नुहोस्: `ssh root@pms.lahanaresort.com`
२. यो कमाण्ड चलाउनुहोस्: `bash /opt/lahana-resort-hms/scripts/backup.sh`
३. फाइल सर्भरको `/backups/` फोल्डरमा बस्नेछ। यसलाई हप्ताको एक पटक बाहिर डाउनलोड गरी सुरक्षित राख्नुहोस्।

---

## 7. Support Contact (मद्दत च्यानल)

For any system questions or emergency support, contact Sudip Parajuli on WhatsApp at **+977-98XXXXXXXX**.
