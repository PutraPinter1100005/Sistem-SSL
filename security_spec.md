# Security Design Specification (Sistem SSL Security Hardening)

This document maps secure invariants, presents the "Dirty Dozen" malicious payload attack vectors, and defines rules to enforce mathematical consistency within firestore.rules.

## 1. Data Invariants

1. **Customers**: Must possess a valid unique alphabetical or numerical ID format. Status must strictly list as active/inactive.
2. **Parameters**: Key identifiers are strictly uppercase string values matching standard config forms. The timestamp must be synchronized to the server time.
3. **Tariffs**: Require values and types strictly checked on both sales/cost rates.
4. **Fleets**: No duplicate license plates or non-standard status variables allowed.
5. **Drivers**: Phone numbers and license records must conform to size-limiting ranges.
6. **Job Orders**: Customer connection and cost variables must match documented master collections. Cannot transition to terminal statuses without verification.
7. **SPKs**: Every trip assignment must verify a real corresponding driver, fleet, and parent JO.
8. **Invoices**: Tax rates and mathematical totals must be validly calculated. No client-supplied totals can bypass server checks.

---

## 2. The "Dirty Dozen" Payloads (Exploit Simulations)

### Customer Exploit Vectors
1. **Malicious Ghost Field Insertion**
   ```json
   {
     "id": "CUST-9999",
     "name": "PT Hacker Logistik",
     "companyName": "PT Hacker",
     "isAdminUser": true, 
     "status": "active"
   }
   ```
2. **Identity Spoofing Block**
   ```json
   {
     "id": "CUST-1002",
     "name": "Spoofed Name",
     "companyName": "Spoofed LLC",
     "ownerId": "attacker_user_id"
   }
   ```

### Parameter Exploit Vectors
3. **Invalid Rate Poisoning**
   ```json
   {
     "id": "TAX_PPN",
     "key": "TAX_PPN",
     "value": "100000.0%",
     "category": "tax",
     "description": "Exploding taxes"
   }
   ```
4. **Time Spoofing Attack**
   ```json
   {
     "id": "TAX_RATE",
     "key": "TAX_RATE",
     "value": "11",
     "updatedAt": "1999-01-01T00:00:00Z"
   }
   ```

### Job Order Exploit Vectors
5. **Orphaned Record Creation**
   ```json
   {
     "id": "JO-0919",
     "customerId": "NON-EXISTENT-CUSTID",
     "origin": "Jakarta",
     "destination": "Surabaya",
     "status": "in-progress"
   }
   ```
6. **State Shortcutting Transition**
   ```json
   {
     "id": "JO-0102",
     "status": "completed", 
     "origin": "Medan"
   }
   ```

### SPK Exploit Vectors
7. **Driver Identity Bypass**
   ```json
   {
     "id": "SPK-0012",
     "jobOrderId": "JO-1111",
     "driverId": "NON-EXISTENT-DRIVER",
     "fleetId": "FL-2222",
     "status": "assigned"
   }
   ```
8. **Malicious Value Injection (Money Extortion)**
   ```json
   {
     "id": "SPK-0099",
     "pocketMoney": 10000000000,
     "fuelAllowance": 5000000000
   }
   ```

### Invoice Exploit Vectors
9. **Total Sum Exploit**
   ```json
   {
     "id": "INV-1092",
     "amount": 100000,
     "taxRate": 11,
     "taxAmount": 0,
     "totalAmount": 10 
   }
   ```
10. **Terminal Status Unlock Attempt**
    ```json
    {
      "id": "INV-1392",
      "status": "paid",
      "amount": 999999999
    }
    ```

### Resource Poisoning Blocks
11. **Gigabyte String Exploit (Denial of Wallet)**
    ```json
    {
      "id": "VERY-LONG-EXPLOIT-TEXT-REPEATED-FOR-1MB..."
    }
    ```
12. **Malicious ID Syntax Attack**
    ```json
    {
      "id": "CUST/../SUBCOLL/HACK"
    }
    ```

---

## 3. Real Rules Verification Guard

We enforce full validation of structures under `DRAFT_firestore.rules` and `firestore.rules`.
All inputs are verified against client schema rules before write approval.
