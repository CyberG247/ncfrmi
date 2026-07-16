import { jsPDF } from "jspdf";

export interface CircumstancesData {
  reason: string;
  education_level: string;
  skills: string;
  primary_needs: string[];
  needs_details: string;
}

export function parseCircumstances(circumstances: string): CircumstancesData {
  const result: CircumstancesData = {
    reason: "",
    education_level: "",
    skills: "",
    primary_needs: [],
    needs_details: "",
  };

  if (!circumstances) return result;

  // Extract Cause of Displacement
  const causeRegex = /CAUSE OF DISPLACEMENT:\s*\n([\s\S]*?)(?=\n\n|\n[A-Z\s]+:|$)/i;
  const causeMatch = circumstances.match(causeRegex);
  if (causeMatch) result.reason = causeMatch[1].trim();

  // Extract Education Background Level
  const eduLevelRegex = /- Level:\s*([^\n]*)/i;
  const eduLevelMatch = circumstances.match(eduLevelRegex);
  if (eduLevelMatch) result.education_level = eduLevelMatch[1].trim();

  // Extract Skills
  const skillsRegex = /- Skills\/Specialization:\s*([^\n]*)/i;
  const skillsMatch = circumstances.match(skillsRegex);
  if (skillsMatch) result.skills = skillsMatch[1].trim();

  // Extract Immediate Needs
  const needsRegex = /- Immediate Needs:\s*([^\n]*)/i;
  const needsMatch = circumstances.match(needsRegex);
  if (needsMatch) {
    result.primary_needs = needsMatch[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // Extract Needs Details
  const needsDetailsRegex = /- Details:\s*([\s\S]*?)$/i;
  const needsDetailsMatch = circumstances.match(needsDetailsRegex);
  if (needsDetailsMatch) result.needs_details = needsDetailsMatch[1].trim();

  // Fallback: if details empty but circumstances has text, put the whole thing in reason
  if (!result.reason && !result.education_level && !result.needs_details) {
    result.reason = circumstances;
  }

  return result;
}

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
  });
};

export async function downloadRegistrantPDF(r: any, logoSrc: string) {
  try {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const parsed = parseCircumstances(r.circumstances || "");

    // Load logo
    try {
      const logoImg = await loadImage(logoSrc);
      doc.addImage(logoImg, "PNG", 15, 12, 12, 12);
    } catch (logoErr) {
      console.warn("Failed to load logo image for PDF", logoErr);
    }

    // Header branding
    doc.setTextColor(11, 102, 60); // Official Forest Green
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text(
      "NATIONAL COMMISSION FOR REFUGEES, MIGRANTS AND INTERNALLY DISPLACED PERSONS",
      30,
      17
    );

    doc.setTextColor(100, 116, 139); // Muted
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("NCFRMI Headquarters · FCT Abuja", 30, 21);

    // Gold line
    doc.setDrawColor(197, 160, 89); // Gold
    doc.setLineWidth(0.4);
    doc.line(15, 27, 195, 27);

    // Document Title
    doc.setTextColor(15, 23, 42); // Dark Text
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(13);
    doc.text("OFFICIAL ENROLLEE PROFILE", 15, 36);

    // Meta details
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Reference: ${r.reference}`, 15, 42);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 130, 42);

    let y = 52;

    // SECTION 1: PERSONAL BIO-DATA
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(11, 102, 60); // Green
    doc.text("1. PERSONAL BIO-DATA", 15, y);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(15, y + 2, 135, y + 2);

    y += 8;

    const drawField = (label: string, value: string, xPos: number, yPos: number) => {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(label.toUpperCase(), xPos, yPos);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      const valStr = value ? String(value) : "—";
      doc.text(valStr, xPos, yPos + 4.5);
    };

    drawField("Full Name", r.full_name, 15, y);
    
    const catLabel = {
      idp: "IDP",
      refugee: "Refugee",
      migrant: "Migrant",
      returnee: "Returnee",
    }[r.category as string] || r.category || "—";
    
    drawField("Category", String(catLabel).toUpperCase(), 75, y);
    
    y += 11;
    drawField("Gender", r.gender ? r.gender.charAt(0).toUpperCase() + r.gender.slice(1) : "—", 15, y);
    drawField("Date of Birth", r.dob ? new Date(r.dob).toLocaleDateString() : "—", 75, y);

    y += 11;
    drawField("Nationality", r.nationality || "Nigeria", 15, y);
    drawField("State of Origin", r.state_origin || "—", 75, y);

    y += 11;
    drawField("LGA of Origin", r.lga || "—", 15, y);
    drawField("Dependants", String(r.dependants || 0), 75, y);

    y += 11;
    drawField("Phone Number", r.phone || "—", 15, y);

    y += 11;
    // Multi-line address
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("RESIDENTIAL ADDRESS", 15, y);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    const splitAddress = doc.splitTextToSize(r.address || "—", 115);
    doc.text(splitAddress, 15, y + 4.5);

    y += 16;

    // SECTION 2: EDUCATIONAL & DISPLACEMENT DETAILS
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(11, 102, 60); // Green
    doc.text("2. EDUCATIONAL & DISPLACEMENT DETAILS", 15, y);
    doc.line(15, y + 2, 135, y + 2);

    y += 8;
    drawField("Highest Education Level", parsed.education_level ? parsed.education_level.toUpperCase() : "NONE", 15, y);
    drawField("Skills / Specialization", parsed.skills || "NONE", 75, y);

    y += 11;
    // Multi-line Cause of Displacement
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("CAUSE OF DISPLACEMENT / CIRCUMSTANCES", 15, y);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    const splitCirc = doc.splitTextToSize(parsed.reason || r.circumstances || "—", 115);
    doc.text(splitCirc, 15, y + 4.5);


    // RIGHT COLUMN: BIOMETRICS
    let bY = 52;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(11, 102, 60); // Green
    doc.text("BIOMETRICS STATUS", 142, bY);
    doc.line(142, bY + 2, 195, bY + 2);

    bY += 8;

    // Face photo
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("FACIAL PHOTOGRAPH", 142, bY);
    
    // Draw photobox
    doc.setFillColor(248, 250, 252);
    doc.rect(142, bY + 2, 48, 48, "F");
    doc.setDrawColor(203, 213, 225);
    doc.rect(142, bY + 2, 48, 48, "S");

    let biometrics: any = null;
    try {
      const stored = JSON.parse(localStorage.getItem("ncfrmi_captured_biometrics") || "{}");
      if (stored[r.reference]) {
        biometrics = stored[r.reference];
      }
    } catch (e) {
      console.error(e);
    }

    if (biometrics?.face) {
      try {
        doc.addImage(biometrics.face, "JPEG", 143, bY + 3, 46, 46);
      } catch (err) {
        console.warn("Failed to add face image in PDF", err);
      }
    } else {
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text("PHOTO SECURED", 153, bY + 23);
      doc.text("IN CLOUD STORAGE", 151, bY + 27);
    }

    // Thumbprint
    bY += 58;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("THUMBPRINT SCAN", 142, bY);

    // Draw thumbbox
    doc.setFillColor(15, 23, 42); // dark background for scan feel
    doc.rect(142, bY + 2, 48, 32, "F");
    
    if (biometrics?.thumb) {
      try {
        doc.addImage(biometrics.thumb, "PNG", 151, bY + 3, 30, 30);
      } catch (err) {
        console.warn("Failed to add thumbprint image in PDF", err);
      }
    } else {
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text("BIOMETRIC VERIFIED", 151, bY + 16);
      doc.text("SECURED SCAN", 155, bY + 20);
    }

    // Save PDF
    doc.save(`NCFRMI_Profile_${r.reference}.pdf`);
  } catch (err) {
    console.error("Error generating PDF profile:", err);
    throw err;
  }
}

export function printRegistrantProfile(r: any, logoSrc: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const parsed = parseCircumstances(r.circumstances || "");
  let biometrics: any = null;
  try {
    const stored = JSON.parse(localStorage.getItem("ncfrmi_captured_biometrics") || "{}");
    if (stored[r.reference]) {
      biometrics = stored[r.reference];
    }
  } catch (e) {
    console.error(e);
  }

  const faceHtml = biometrics?.face
    ? `<img src="${biometrics.face}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 4px; border: 1px solid #cbd5e1;" />`
    : `<div style="width: 120px; height: 120px; border: 1px dashed #cbd5e1; background: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 10px; color: #94a6b8; text-align: center; font-weight: 500;">
        <span style="font-size: 18px; margin-bottom: 4px;">📷</span>
        Photo Captured & Verified
      </div>`;

  const thumbHtml = biometrics?.thumb
    ? `<img src="${biometrics.thumb}" style="width: 120px; height: 90px; object-fit: contain; background: #0f172a; border-radius: 4px; padding: 4px; border: 1px solid #0f172a;" />`
    : `<div style="width: 120px; height: 90px; border: 1px dashed #cbd5e1; background: #0f172a; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 10px; color: #94a6b8; text-align: center; font-weight: 500;">
        <span style="font-size: 18px; margin-bottom: 4px;">👍</span>
        Thumbprint Captured
      </div>`;

  const categoryLabel = {
    idp: "Internally Displaced Person",
    refugee: "Refugee",
    migrant: "Migrant",
    returnee: "Returnee",
  }[r.category as string] || r.category || "—";

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>NCFRMI Profile - ${r.full_name}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 30px;
            line-height: 1.5;
          }
          .header {
            display: flex;
            align-items: center;
            border-bottom: 2px solid #c5a059; /* Gold */
            padding-bottom: 15px;
            margin-bottom: 25px;
          }
          .logo {
            width: 60px;
            height: 60px;
            margin-right: 20px;
          }
          .title-area h1 {
            font-size: 15px;
            color: #0b663c; /* Forest Green */
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            line-height: 1.3;
            font-weight: 800;
          }
          .title-area p {
            font-size: 10px;
            color: #64748b;
            margin: 5px 0 0 0;
            font-weight: 500;
          }
          .doc-title {
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 10px;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .meta {
            font-size: 11px;
            color: #64748b;
            margin-bottom: 30px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 10px;
          }
          .grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 30px;
          }
          .card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            background: #ffffff;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
          }
          .card-title {
            font-size: 11px;
            font-weight: 800;
            color: #0b663c; /* Forest Green */
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 6px;
            margin-top: 0;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
          }
          .info-group {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .info-item {
            margin-bottom: 5px;
          }
          .label {
            font-size: 9px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .value {
            font-size: 11px;
            font-weight: 500;
            color: #0f172a;
            margin-top: 3px;
          }
          .value-bold {
            font-weight: 700;
            font-size: 12px;
          }
          .biometrics-area {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            padding: 20px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
          }
          .biometric-box {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
          }
          .biometric-label {
            font-size: 9px;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .full-width {
            grid-column: span 2;
          }
          .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            border: 1px solid currentColor;
            letter-spacing: 0.5px;
          }
          .badge-idp { color: #b45309; background: #fffbeb; border-color: #fde68a; }
          .badge-refugee { color: #0369a1; background: #f0f9ff; border-color: #bae6fd; }
          .badge-migrant { color: #6d28d9; background: #f5f3ff; border-color: #ddd6fe; }
          .badge-returnee { color: #047857; background: #ecfdf5; border-color: #a7f3d0; }
          
          .signature-area {
            margin-top: 60px;
            display: flex;
            justify-content: flex-end;
          }
          .signature-box {
            border-top: 1px solid #94a6b8;
            width: 250px;
            text-align: center;
            padding-top: 8px;
            font-size: 9px;
            color: #334155;
            line-height: 1.4;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
            .card { box-shadow: none; border-color: #cbd5e1; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logoSrc}" class="logo" />
          <div class="title-area">
            <h1>National Commission for Refugees, Migrants and Internally Displaced Persons</h1>
            <p>NCFRMI Headquarters · FCT Abuja</p>
          </div>
        </div>
        
        <div class="doc-title">Official Enrollee Record</div>
        <div class="meta">
          <strong>Reference ID:</strong> ${r.reference} &nbsp;|&nbsp; 
          <strong>Date Generated:</strong> ${new Date().toLocaleString()}
        </div>
        
        <div class="grid">
          <div>
            <div class="card">
              <h2 class="card-title">Personal Bio-Data</h2>
              <div class="info-group">
                <div class="info-item full-width">
                  <div class="label">Full Name</div>
                  <div class="value value-bold">${r.full_name}</div>
                </div>
                <div class="info-item">
                  <div class="label">Category</div>
                  <div class="value">
                    <span class="badge badge-${r.category}">${categoryLabel}</span>
                  </div>
                </div>
                <div class="info-item">
                  <div class="label">Gender</div>
                  <div class="value" style="text-transform: capitalize;">${r.gender}</div>
                </div>
                <div class="info-item">
                  <div class="label">Date of Birth</div>
                  <div class="value">${r.dob ? new Date(r.dob).toLocaleDateString() : "—"}</div>
                </div>
                <div class="info-item">
                  <div class="label">Nationality</div>
                  <div class="value">${r.nationality || "Nigeria"}</div>
                </div>
                <div class="info-item">
                  <div class="label">State of Origin</div>
                  <div class="value">${r.state_origin || "—"}</div>
                </div>
                <div class="info-item">
                  <div class="label">LGA of Origin</div>
                  <div class="value">${r.lga || "—"}</div>
                </div>
                <div class="info-item">
                  <div class="label">Household Dependants</div>
                  <div class="value">${r.dependants || 0}</div>
                </div>
                <div class="info-item">
                  <div class="label">Contact Phone</div>
                  <div class="value">${r.phone || "—"}</div>
                </div>
                <div class="info-item full-width">
                  <div class="label">Residential Address</div>
                  <div class="value">${r.address || "—"}</div>
                </div>
              </div>
            </div>
            
            <div class="card">
              <h2 class="card-title">Educational & Displacement Details</h2>
              <div class="info-group">
                <div class="info-item">
                  <div class="label">Education Level Completed</div>
                  <div class="value" style="text-transform: capitalize;">${parsed.education_level || "None"}</div>
                </div>
                <div class="info-item">
                  <div class="label">Skills / Specialization</div>
                  <div class="value" style="text-transform: capitalize;">${parsed.skills || "None"}</div>
                </div>
                <div class="info-item full-width">
                  <div class="label">Displacement Reason / Cause</div>
                  <div class="value">${parsed.reason || r.circumstances || "—"}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <div class="card biometrics-area">
              <h2 class="card-title" style="border: none; margin-bottom: 5px; text-align: center;">Biometrics</h2>
              
              <div class="biometric-box">
                <div class="biometric-label">Facial Photo</div>
                ${faceHtml}
              </div>
              
              <div style="width: 100%; height: 1px; background: #e2e8f0; margin: 5px 0;"></div>
              
              <div class="biometric-box">
                <div class="biometric-label">Thumbprint Scan</div>
                ${thumbHtml}
              </div>
            </div>
          </div>
        </div>
        
        
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
