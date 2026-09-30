# Subject Data Table Component

A reusable React DataTable component for displaying subject information including Subject Code, Subject Name, Department Name, Camp ID, Camp Officer ID, and Total Papers in Each Subject.

## Features

- **Responsive Design**: Works seamlessly on all screen sizes
- **Search Functionality**: Real-time search across all fields
- **Sorting**: Click column headers to sort data
- **Pagination**: Built-in pagination with customizable rows per page
- **Styled UI**: Professional design with hover effects and color coding
- **Flexible Data Format**: Accepts multiple data formats

## Files Created

1. **`SubjectDataTable.jsx`** - Main reusable component
2. **`SubjectDetailsPage.jsx`** - Full page example with API integration
3. **`SubjectTableExample.jsx`** - Usage examples and integration patterns
4. **`README.md`** - This documentation file

## Installation

The component uses `react-data-table-component` which should already be installed in your project. If not:

```bash
npm install react-data-table-component
```

## Basic Usage

### Import the Component

```jsx
import SubjectDataTable from '../components/SubjectDataTable/SubjectDataTable';
```

### Use with Data Array

```jsx
const MyComponent = () => {
  const subjectData = [
    {
      sub_code: 'TE24101T',
      sub_name: 'CONTEMPORARY INDIA AND EDUCATION',
      department: '01',
      Camp_id: 'FSH12',
      camp_offcer_id_examiner: '600309',
      Sub_Max_Papers: '75',
    },
    // ... more subjects
  ];

  return (
    <SubjectDataTable 
      data={subjectData}
      isLoading={false}
      title="My Subjects"
    />
  );
};
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | Array | `[]` | Array of subject objects |
| `isLoading` | Boolean | `false` | Shows loading spinner when true |
| `title` | String | `"Subject Information"` | Table header title |

## Data Format

The component accepts subject objects with the following fields:

```javascript
{
  sub_code: String,              // Subject code (e.g., 'TE24101T')
  sub_name: String,              // Subject name
  department: String,            // Department code (e.g., '01')
  Camp_id: String,               // Camp identifier
  camp_offcer_id_examiner: String, // Camp officer ID
  Sub_Max_Papers: String,        // Total papers in subject
}
```

**Alternative field names** (automatically mapped):
- `Subcode` → `sub_code`
- `SUBNAME` → `sub_name`
- `Dep_Name` → `department`
- `Camp_Officer_Id` → `camp_offcer_id_examiner`
- `Total_Paper_In_Each_Subject` → `Sub_Max_Papers`

## Integration Examples

### Example 1: With Redux State

```jsx
import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import SubjectDataTable from '../components/SubjectDataTable/SubjectDataTable';

const MyDashboard = () => {
  const { userInfo } = useSelector((state) => state.auth);
  
  const subjectData = useMemo(() => {
    if (!userInfo?.subcode) return [];
    
    const subcodes = userInfo.subcode.split(',');
    const departments = userInfo.department?.split(',') || [];
    const campIds = userInfo.Camp_id?.split(',') || [];
    const campOfficers = userInfo.camp_offcer_id_examiner?.split(',') || [];
    const maxPapers = userInfo.Sub_Max_Papers?.split(',') || [];
    
    return subcodes.map((code, index) => ({
      sub_code: code.trim(),
      department: departments[index]?.trim() || '-',
      Camp_id: campIds[index]?.trim() || '-',
      camp_offcer_id_examiner: campOfficers[index]?.trim() || '-',
      Sub_Max_Papers: maxPapers[index]?.trim() || '0',
      // You'll need to fetch subject names separately from sub_master
    }));
  }, [userInfo]);
  
  return <SubjectDataTable data={subjectData} />;
};
```

### Example 2: With API Query

```jsx
import { useGetSubjectDataQuery } from '../redux-slice/SubjectMasterApiSlice';
import SubjectDataTable from '../components/SubjectDataTable/SubjectDataTable';

const SubjectList = () => {
  const { data: apiData, isLoading } = useGetSubjectDataQuery();
  
  const subjectData = useMemo(() => {
    if (!apiData?.data) return [];
    return apiData.data.map(subject => ({
      sub_code: subject.Subcode,
      sub_name: subject.SUBNAME,
      department: subject.Dep_Name,
      Camp_id: subject.Camp_id || '-',
      camp_offcer_id_examiner: subject.camp_offcer_id || '-',
      Sub_Max_Papers: subject.Max_Papers || '0',
    }));
  }, [apiData]);
  
  return <SubjectDataTable data={subjectData} isLoading={isLoading} />;
};
```

### Example 3: With Dashboard Fetch

```jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import SubjectDataTable from '../components/SubjectDataTable/SubjectDataTable';

const SubjectPage = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/dashboard/subcode-fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            department: userInfo.department,
            subcode: userInfo.subcode,
            Eva_Subject: userInfo.Eva_Subject,
            Camp_id: userInfo.Camp_id,
            camp_offcer_id_examiner: userInfo.camp_offcer_id_examiner,
            Sub_Max_Papers: userInfo.Sub_Max_Papers,
          }),
        });
        
        const data = await response.json();
        setSubjects(data.subcode_subjects || []);
      } catch (error) {
        console.error('Error fetching subjects:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userInfo) fetchSubjects();
  }, [userInfo]);

  return (
    <SubjectDataTable 
      data={subjects} 
      isLoading={loading}
      title="My Assigned Subjects"
    />
  );
};
```

## Customization

### Modify Column Styles

Edit the `columns` array in `SubjectDataTable.jsx`:

```jsx
{
  name: 'Subject Code',
  selector: row => row.sub_code,
  sortable: true,
  width: '140px',
  cell: (row) => (
    <span style={{ fontWeight: '600', color: '#2c5282' }}>
      {row.sub_code}
    </span>
  ),
}
```

### Change Table Styles

Modify the `customStyles` object:

```jsx
const customStyles = {
  headRow: {
    style: {
      backgroundColor: '#your-color',
      fontSize: '14px',
      // ... more styles
    },
  },
  // ... other style sections
};
```

### Add More Columns

Add to the `columns` array:

```jsx
{
  name: 'Rate Per Script',
  selector: row => row.rate_per_script || '-',
  sortable: true,
  width: '130px',
  center: true,
}
```

## Features Included

### Search Bar
- Real-time filtering across all visible fields
- Case-insensitive search
- Shows count of filtered results

### Pagination
- Default: 10 rows per page
- Options: 10, 20, 30, 50, 100 rows
- Navigation controls

### Sorting
- Click any column header to sort
- Toggle ascending/descending
- Works with filtered data

### Responsive Design
- Adapts to different screen sizes
- Horizontal scroll on small screens
- Touch-friendly controls

## Styling

The component uses:
- **Bootstrap 5** for layout and controls
- **Custom CSS** via customStyles object
- **React Icons** (FiSearch) for search icon

Color scheme:
- Primary: `#2c5282` (blue)
- Secondary: `#64748b` (gray)
- Success: `#16a34a` (green)
- Background: `#f8fafc` (light gray)

## API Endpoint

The component expects data from:

**Endpoint**: `/api/dashboard/subcode-fetch`  
**Method**: POST  
**Body**:
```json
{
  "department": "01,01,01",
  "subcode": "TE24101T,TE24102T",
  "Eva_Subject": "1,1",
  "Camp_id": "FSH12,FSH12",
  "camp_offcer_id_examiner": "600309,600309",
  "Sub_Max_Papers": "75,80"
}
```

**Response**:
```json
{
  "subcode_subjects": [
    {
      "sub_code": "TE24101T",
      "sub_name": "CONTEMPORARY INDIA AND EDUCATION",
      "department": "01",
      "Camp_id": "FSH12",
      "camp_offcer_id_examiner": "600309",
      "Sub_Max_Papers": "75"
    }
  ]
}
```

## Troubleshooting

### No data showing
- Check if `data` prop contains valid array
- Verify field names match component expectations
- Check browser console for errors

### Search not working
- Ensure data fields are strings
- Check if `searchText` state is updating
- Verify `filteredData` memo is running

### Styling issues
- Check Bootstrap is imported in your app
- Verify customStyles object structure
- Check for CSS conflicts

## File Locations

```
frontend/src/
├── components/
│   └── SubjectDataTable/
│       ├── SubjectDataTable.jsx      (Main component)
│       ├── SubjectTableExample.jsx   (Usage examples)
│       └── README.md                 (This file)
└── pages/
    └── Dashboard/
        └── SubjectDetails/
            └── SubjectDetailsPage.jsx (Full page example)
```

## License

Part of the Onscreen Valuation project.
