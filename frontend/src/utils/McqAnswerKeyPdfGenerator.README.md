# MCQ Answer Key PDF Generator

## Overview
This utility generates professional PDF documents for MCQ answer keys using `@react-pdf/renderer`.

## Features
- ✅ Clean, professional table layout
- ✅ Sorted by question number automatically
- ✅ Metadata header (Subject, Department, Evaluator, etc.)
- ✅ Alternating row colors for better readability
- ✅ Watermark background
- ✅ Footer with generation timestamp
- ✅ Responsive column widths

## Installation
```bash
npm install @react-pdf/renderer
```

## Usage

### Basic Usage (Download Button)
```jsx
import { McqAnswerKeyPdfDownload } from '../utils/McqAnswerKeyPdfGenerator';

// In your component
<McqAnswerKeyPdfDownload 
  data={answerKeyData}
  subcode="221AEC501"
  filename="MCQ_AnswerKey_CustomName.pdf"
/>
```

### Data Format
The component expects an array of objects with the following structure:
```javascript
[
  {
    id: 9,
    Qst_Number: 1,
    Qst_Ans: "B",
    Qst_Remarks: "Description or remarks",
    Eva_Id: "100003",
    Subcode: "221AEC501",
    SubName: "MICRO ECONOMIC THEORY AND APPLICATIONS",
    Dep_Name: "03",
    Eva_Month: "May_2026",
    Upload_Date: "29-03-2026 01:49pm",
    Updated_Flg: "Y"
  },
  // ... more questions
]
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `data` | Array | Yes | Array of answer key objects |
| `subcode` | String | No | Subject code (used in filename) |
| `filename` | String | No | Custom filename for downloaded PDF |

## PDF Structure

### Header Section
- Title: "MCQ Answer Key"
- Subject Name
- Subject Code
- Department
- Evaluator ID
- Evaluation Month
- Upload Date
- Total Questions

### Table Section
| Question No. | Answer | Remarks |
|--------------|--------|---------|
| 1 | B | Description text |
| 2 | C | Another remark |
| ... | ... | ... |

### Footer
- Generation timestamp in IST
- System identifier

## Styling
The PDF uses a professional color scheme:
- Primary Blue: #1e3a6e, #2a5298
- Gray Scale: #f8f9fa, #495057, #212529
- Border Colors: #dee2e6, #e9ecef

## Example Implementation
```jsx
// Get data from backend
const { data: mcqDataFromBack } = useGetMcqDataBySubcodeFromTheBackQuery({
  Eva_Id: userInfo.username,
  Subcode: selectedSubcode
});

// Render PDF download button
{mcqDataFromBack?.data?.length > 0 && (
  <McqAnswerKeyPdfDownload 
    data={mcqDataFromBack.data}
    subcode={selectedSubcode}
    filename={`AnswerKey_${selectedSubcode}_${Date.now()}.pdf`}
  />
)}
```

## Notes
- Questions are automatically sorted by `Qst_Number`
- Missing remarks show as "-"
- Empty data array shows "No Data Available" button (disabled)
- Generated PDFs are A4 size with proper margins
- Alternating row colors improve readability

## Customization
To customize styling, edit the `styles` object in `McqAnswerKeyPdfGenerator.jsx`:
```javascript
const styles = StyleSheet.create({
  // Modify styles here
  title: {
    fontSize: 18,
    color: '#1e3a6e',
    // ... your custom styles
  }
});
```
