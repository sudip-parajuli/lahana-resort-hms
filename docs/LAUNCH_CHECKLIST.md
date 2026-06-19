# Lahana Resort PMS — Go-Live Launch Checklist
## (सञ्चालन पूर्वको चेकलिस्ट)

This checklist ensures all configurations, servers, domain security, integrations, and staff training items are complete before launching the Lahana Resort Property Management System.

---

## 1. One Week Before Launch (सञ्चालन हुनु १ हप्ता अघि)

- [ ] **Domain DNS Records (डोमेन मिलान)**: Verify that `pms.lahanaresort.com` points to the VPS server's public IP address.
- [ ] **Nginx & SSL Configuration (सुरक्षित सर्भर)**: Run the setup script `scripts/server_setup.sh` on the VPS to verify SSL certificates are issued by Let's Encrypt.
- [ ] **SMTP Email Setup (इमेल प्रणाली)**: Update default email in `.env` to `info@lahanaresort.com` and verify that confirmation emails are received on new bookings.
- [ ] **Sparrow SMS Gateway (एसएमएस गेटवे)**: Verify that the Sparrow SMS token is active and SMS templates are dispatching successfully (test booking/check-in SMS alerts).
- [ ] **Table QR Codes (क्युआर कोडहरू)**: Generate QR codes for all tables via the resort admin panel, print them on 85x54mm cards, laminate them, and place them on restaurant tables.
- [ ] **Property Seed Data (सुरुवाती डाटा)**: Execute the seed command `python manage.py seed_lahana` inside the backend container to setup rooms, staff logins, and departments.
- [ ] **Verify Room Prices (कोठा मूल्य जाँच)**: Go to Room Types and check that room rates correspond exactly to Lahana's rates.

---

## 2. One Day Before Launch (सञ्चालन हुनु १ दिन अघि)

- [ ] **Switch Sandbox to Production (लाइभ भुक्तानी गेटवे)**: In `.env`, change payment gateways from sandbox to production:
  - `ESEWA_SANDBOX=False`
  - `KHALTI_SANDBOX=False`
  - `FONEPAY_SANDBOX=False`
- [ ] **Check Backup Script (ब्याकअप जाँच)**: Run the backup script manually:
  `bash scripts/backup.sh`
  Verify that the gzip backup file is created under the `/backups/` directory on the host VPS.
- [ ] **Add Backup Cron Task (दैनिक स्वचालित ब्याकअप)**: Verify that the 3:00 AM daily cron task is active on the server:
  `0 3 * * * /bin/bash /opt/lahana-resort-hms/scripts/backup.sh`
- [ ] **Verify Staff PWAs (कर्मचारी मोबाइल एप)**: Have at least one waiter and housekeeper log into their respective interfaces on their mobile devices and click "Add to Home Screen" to install shortcuts.
- [ ] **Print Operations Guides (निर्देशिका वितरण)**: Print the PDF version of the Front Desk, Waiter, Housekeeping, and Manager guides, and hand copies to each department team lead.

---

## 3. Launch Day (सञ्चालनको दिन)

- [ ] **Clean Up Test Reservations (परीक्षण डाटा सफा गर्ने)**: Clear any dummy check-ins or fake bills placed during training sessions to ensure clean financial accounting.
- [ ] **Import Active Bookings (चालु बुकिङहरू चढाउने)**: Manually enter any guests currently staying in the resort or expected future reservations that were taken via old paper logs.
- [ ] **Confirm Online Booking Widget (अनलाइन बुकिङ सुरु)**: Embed the booking iframe on `https://lahanaresort.com` and test a real reservation with live deposit payment via eSewa.
- [ ] **Live Monitor (निगरानी)**: Monitor server CPU/RAM usage and Django logs for the first 3 hours of operation.

---

## 4. One Week After Launch (सञ्चालन भएको १ हप्ता पछि)

- [ ] **Verify Daily Backups (ब्याकअप जाँच)**: Access the `/backups/` directory on the server and check that 7 daily database dump files exist.
- [ ] **Review Staff Feedback (कर्मचारी प्रतिक्रिया)**: Sit down with the receptionists and waiters to discuss if any usability issues or network drops occurred in the Garden area.
- [ ] **Run Monthly Payroll Test (तलब प्रणाली जाँच)**: Process draft payslips for a dummy staff member to ensure progressive tax brackets are calculating correctly.
- [ ] **Review Tax Sales Log (भ्याट खाता जाँच)**: Verify that the compiled Nepal VAT Sales Register contains correct sales totals, VAT amounts, and service charges.
