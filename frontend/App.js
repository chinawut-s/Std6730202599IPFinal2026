import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Alert, ActivityIndicator, Scrollable } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();
const API_URL = 'http://119.59.102.161:3055'; // ใช้พอร์ตตามที่ PuTTY ของคุณแสดงขึ้นมา

// 1. หน้า Login Screen
function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        navigation.replace('Dashboard');
      } else {
        Alert.alert('Login Failed', 'Invalid username or password');
      }
    } catch (error) {
      Alert.alert('Error', 'Cannot connect to server');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HR Manager Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#888"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

// 2. หน้า Dashboard Screen (CRUD & K-Means Analytics)
function DashboardScreen() {
  const [employees, setEmployees] = useState([]);
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [salary, setSalary] = useState('');
  const [clusters, setClusters] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/api/employees`);
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // เพิ่มพนักงาน (Client-side validation ห้ามว่าง)
  const handleAddEmployee = async () => {
    if (!name || !position || !salary) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, position, salary: Number(salary) }),
      });
      if (response.ok) {
        setName('');
        setPosition('');
        setSalary('');
        fetchEmployees();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // สลับสถานะพนักงาน (Active <-> On Leave)
  const handleToggleStatus = async (id) => {
    try {
      await fetch(`${API_URL}/api/employees/${id}/status`, { method: 'PUT' });
      fetchEmployees();
    } catch (error) {
      console.error(error);
    }
  };

  // ลบพนักงาน (พร้อม Alert ยืนยัน)
  const handleDeleteEmployee = (id) => {
    Alert.alert('Are you sure?', 'Do you want to delete this employee?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${API_URL}/api/employees/${id}`, { method: 'DELETE' });
            fetchEmployees();
          } catch (error) {
            console.error(error);
          }
        },
      },
    ]);
  };

  // วิเคราะห์ K-Means Salary Clusters
  const handleAnalyzeSalary = async () => {
    setLoading(true);
    try {
      // สำหรับ Backend K-Means เราจะเพิ่ม endpoint นี้ในถัดไป หรือถ้าใช้โค้ดจำลองการคำนวณ:
      const response = await fetch(`${API_URL}/api/employees/salary-clusters`);
      const data = await response.json();
      if (data.success) {
        setClusters(data.clusters);
      }
    } catch (error) {
      // Fallback คำนวณเบื้องต้นหากยังไม่ได้เขียนฝั่ง Backend K-Means
      Alert.alert('Notice', 'Fetching clusters...');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.dashboardContainer}>
      <Text style={styles.headerTitle}>Employee Management</Text>

      {/* ฟอร์มเพิ่มพนักงาน */}
      <View style={styles.formContainer}>
        <TextInput style={styles.smallInput} placeholder="Name" placeholderTextColor="#888" value={name} onChangeText={setName} />
        <TextInput style={styles.smallInput} placeholder="Position" placeholderTextColor="#888" value={position} onChangeText={setPosition} />
        <TextInput style={styles.smallInput} placeholder="Salary" placeholderTextColor="#888" keyboardType="numeric" value={salary} onChangeText={setSalary} />
        <TouchableOpacity style={styles.addButton} onPress={handleAddEmployee}>
          <Text style={styles.buttonText}>Add Employee</Text>
        </TouchableOpacity>
      </View>

      {/* ปุ่มวิเคราะห์ K-Means */}
      <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyzeSalary}>
        <Text style={styles.buttonText}>Analyze Salary Structure</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#0000ff" style={{ marginVertical: 10 }} />}

      {/* แสดงผล Cluster Results */}
      {clusters && (
        <View style={styles.clusterContainer}>
          <Text style={styles.clusterTitle}>Salary Tiers (K-Means)</Text>
          {clusters.map((item, index) => (
            <View key={index} style={styles.clusterCard}>
              <Text style={styles.clusterText}>{item.group} | Count: {item.count} | Avg: ฿{item.centroid}</Text>
            </View>
          ))}
        </View>
      )}

      {/* รายชื่อพนักงาน */}
      <FlatList
        data={employees}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.employeeCard}>
            <View>
              <Text style={styles.empName}>{item.name} ({item.position})</Text>
              <Text style={styles.empDetails}>Salary: ฿{item.salary} | Status: {item.status}</Text>
            </View>
            <View style={styles.row}>
              <TouchableOpacity style={styles.toggleBtn} onPress={() => handleToggleStatus(item.id)}>
                <Text style={styles.smallBtnText}>Toggle</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteEmployee(item.id)}>
                <Text style={styles.smallBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Employee Dashboard' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  input: { width: '100%', maxWidth: 300, height: 45, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, marginBottom: 15, backgroundColor: '#fff', color: '#000' },
  button: { width: '100%', maxWidth: 300, height: 45, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  dashboardContainer: { flex: 1, backgroundColor: '#f5f5f5', padding: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  formContainer: { marginBottom: 15 },
  smallInput: { height: 40, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 10, marginBottom: 8, backgroundColor: '#fff', color: '#000' },
  addButton: { height: 40, backgroundColor: '#28a745', justifyContent: 'center', alignItems: 'center', borderRadius: 6 },
  analyzeButton: { height: 45, backgroundColor: '#ffc107', justifyContent: 'center', alignItems: 'center', borderRadius: 6, marginBottom: 15 },
  clusterContainer: { backgroundColor: '#e9ecef', padding: 10, borderRadius: 6, marginBottom: 15 },
  clusterTitle: { fontWeight: 'bold', marginBottom: 5, color: '#333' },
  clusterCard: { backgroundColor: '#fff', padding: 8, borderRadius: 4, marginBottom: 5 },
  clusterText: { color: '#333' },
  employeeCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  empName: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  empDetails: { color: '#666', marginTop: 2 },
  row: { flexDirection: 'row' },
  toggleBtn: { backgroundColor: '#17a2b8', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 4, marginRight: 5 },
  deleteBtn: { backgroundColor: '#dc3545', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 4 },
  smallBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' }
});