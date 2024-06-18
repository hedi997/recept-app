import { StatusBar } from "expo-status-bar";
import React, { useState, useEffect, useLayoutEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Button,
  TextInput,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator();

function HomeScreen({ navigation, route }) {
  const [recipes, setRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredRecipes, setFilteredRecipes] = useState([]);

  useEffect(() => {
    if (route.params?.newRecipe) {
      const updatedRecipes = [...recipes, route.params.newRecipe];
      setRecipes(updatedRecipes);
      setFilteredRecipes(updatedRecipes);
    }
  }, [route.params?.newRecipe]);

  useEffect(() => {
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = recipes.filter(
        (recipe) =>
          recipe.title.toLowerCase().includes(lowercasedQuery) ||
          recipe.ingredients.some((ingredient) =>
            ingredient.toLowerCase().includes(lowercasedQuery)
          ) ||
          recipe.cookingTime.toString().includes(lowercasedQuery)
      );
      setFilteredRecipes(filtered);
    } else {
      setFilteredRecipes(recipes);
    }
  }, [searchQuery, recipes]);

  const removeRecipe = (index) => {
    const updatedRecipes = recipes.filter((_, i) => i !== index);
    setRecipes(updatedRecipes);
    setFilteredRecipes(updatedRecipes);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mina recept</Text>
      <StatusBar style="auto" />
      <Button
        title="Skapa nytt recept"
        onPress={() => navigation.navigate("Skapa recept")}
      />
      <TextInput
        style={styles.input}
        placeholder="Sök efter recept..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={filteredRecipes}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.recipeItem}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("RecipeDetails", { recipe: item })
              }
            >
              <Text style={styles.recipeTitle}>{item.title}</Text>
            </TouchableOpacity>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeRecipe(index)}
              >
                <Text style={styles.removeButtonText}>Ta bort</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

function RecipeDetailsScreen({ route, navigation }) {
  const { recipe } = route.params;

  const downloadRecipe = async () => {
    const recipeContent = `
      Titel: ${recipe.title}
      Koktid: ${recipe.cookingTime} minuter
      Ingredienser:
      ${recipe.ingredients.map((ingredient) => `• ${ingredient}`).join("\n")}
      Instruktioner:
      ${recipe.instructions}
    `;
    const fileUri = FileSystem.documentDirectory + `${recipe.title}.txt`;
    try {
      await FileSystem.writeAsStringAsync(fileUri, recipeContent);
      shareFile(fileUri);
    } catch (error) {
      console.error("Det uppstod ett fel vid nedladdning av recept:", error);
    }
  };

  const shareFile = async (fileUri) => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Dela-funktioner är inte tillgängliga på denna enhet.");
      }
    } catch (error) {
      console.error("Det uppstod ett fel vid delning av fil:", error);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: recipe.title,
    });
  }, [navigation, recipe]);

  return (
    <View style={styles.container}>
      <Text style={styles.subHeader}>Koktid: {recipe.cookingTime} minuter</Text>
      <Text style={styles.subHeader}>Ingredienser:</Text>
      {recipe.ingredients.map((ingredient, i) => (
        <Text key={i} style={styles.leftAlignedText}>
          • {ingredient}
        </Text>
      ))}
      <Text style={styles.subHeader}>Instruktioner:</Text>
      <Text style={styles.leftAlignedText}>{recipe.instructions}</Text>

      <View style={styles.downloadButtonContainer}>
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={downloadRecipe}
        >
          <Text style={styles.downloadButtonText}>Ladda ner</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AddRecipeScreen({ navigation }) {
  const [title, setTitle] = useState("");
  const [ingredient, setIngredient] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [cookingTime, setCookingTime] = useState("");
  const [instructions, setInstructions] = useState("");

  const addIngredient = () => {
    if (ingredient.trim() !== "") {
      setIngredients([...ingredients, ingredient]);
      setIngredient("");
    }
  };

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Skapa nytt recept</Text>
      <TextInput
        style={styles.input}
        placeholder="Receptets Rubrik"
        value={title}
        onChangeText={setTitle}
      />
      <View style={styles.ingredientContainer}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Ingrediens"
          value={ingredient}
          onChangeText={setIngredient}
        />
        <TouchableOpacity style={styles.addButton} onPress={addIngredient}>
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={ingredients}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.ingredientItem}>
            <Text style={styles.ingredientText}>• {item}</Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeIngredient(index)}
            >
              <Text style={styles.removeButtonText}>Ta bort</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <TextInput
        style={styles.input}
        placeholder="Koktid (minuter)"
        value={cookingTime}
        onChangeText={setCookingTime}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Hur man gör maträtten"
        value={instructions}
        onChangeText={setInstructions}
      />
      <Button
        title="Skapa recept"
        onPress={() => {
          const newRecipe = { title, ingredients, instructions, cookingTime };
          navigation.navigate("Home", { newRecipe });
        }}
      />
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          options={{ title: "Mina recept" }}
          name="Home"
          component={HomeScreen}
        />
        <Stack.Screen
          name="RecipeDetails"
          component={RecipeDetailsScreen}
          options={{ headerShown: true }}
        />
        <Stack.Screen name="Skapa recept" component={AddRecipeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    padding: 16,
  },
  header: {
    fontSize: 24,
    marginBottom: 16,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 12,
    padding: 10,
    width: "100%",
  },
  ingredientContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  addButton: {
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 3,
    marginLeft: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 20,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
    width: "100%",
  },
  ingredientText: {
    fontSize: 16,
  },
  removeButton: {
    backgroundColor: "red",
    padding: 5,
    borderRadius: 5,
  },
  removeButtonText: {
    color: "white",
    fontSize: 12,
  },
  recipeItem: {
    padding: 16,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
    width: "100%",
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  buttonGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  downloadButtonContainer: {
    marginTop: 16,
    alignSelf: "stretch",
    alignItems: "flex-start",
  },
  downloadButton: {
    backgroundColor: "#4CAF50",
    padding: 5,
    borderRadius: 5,
    marginLeft: 8,
  },
  downloadButtonText: {
    color: "white",
    fontSize: 12,
  },
  subHeader: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
  },
  leftAlignedText: {
    textAlign: "left",
  },
});
