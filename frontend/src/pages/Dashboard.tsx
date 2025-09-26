import React, { useState } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Typography,
  Paper,
} from '@mui/material';
import {
  Music,
  FileText,
  Calendar,
  MapPin,
  List,
  Upload,
} from 'lucide-react';
import Layout from '../components/common/Layout';
import ThemeManager from '../components/managers/ThemeManager';
import VersionManager from '../components/managers/VersionManager';
import SheetMusicManager from '../components/managers/SheetMusicManager';
import EventManager from '../components/managers/EventManager';
import LocationManager from '../components/managers/LocationManager';
import RepertoireManager from '../components/managers/RepertoireManager';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const tabs = [
    { label: 'Themes', icon: <Music size={20} />, component: <ThemeManager /> },
    { label: 'Versions', icon: <FileText size={20} />, component: <VersionManager /> },
    { label: 'Sheet Music', icon: <Upload size={20} />, component: <SheetMusicManager /> },
    { label: 'Events', icon: <Calendar size={20} />, component: <EventManager /> },
    { label: 'Locations', icon: <MapPin size={20} />, component: <LocationManager /> },
    { label: 'Repertoires', icon: <List size={20} />, component: <RepertoireManager /> },
  ];

  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ mb: 1, background: 'linear-gradient(45deg, #00d4aa, #4fc3f7)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', fontWeight: 700 }}>
            Sheet Music Manager
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your musical content, events, and repertoires
          </Typography>
        </Box>

        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="dashboard tabs"
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                gap: 1,
                flexDirection: 'row',
                minHeight: 64,
              },
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                icon={tab.icon}
                label={tab.label}
                id={`dashboard-tab-${index}`}
                aria-controls={`dashboard-tabpanel-${index}`}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Paper>

        {tabs.map((tab, index) => (
          <TabPanel key={index} value={activeTab} index={index}>
            {tab.component}
          </TabPanel>
        ))}
      </Container>
    </Layout>
  );
};

export default Dashboard;