import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppBar from '@/components/AppBar';
import SearchBar from '@/components/SearchBar';

interface Character {
  id: number;
  name: string;
  image: string;
  species: string;
  status: string;
  gender: string;
}

const HomeScreen: React.FC = () => {
  const [todosPersonagens, setTodosPersonagens] = useState<Character[]>([]);
  const [personagemSelecionado, setPersonagemSelecionado] = useState<Character | null>(null);
  const [carregando, setCarregando] = useState<boolean>(false);
  const [paginaAtual, setPaginaAtual] = useState<number>(1);
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [favoritos, setFavoritos] = useState<{ [key: number]: boolean }>({});
  const [favoritosCarregados, setFavoritosCarregados] = useState<boolean>(false);

  let timeout: NodeJS.Timeout | null = null;

  useEffect(() => {
    carregarFavoritos();
  }, []);

  useEffect(() => {
    if (favoritosCarregados) {
      carregarPersonagens();
    }
  }, [favoritosCarregados]);

  useEffect(() => {
    if (favoritosCarregados) {
      salvarFavoritos();
    }
  }, [favoritos]);

  const carregarPersonagens = async () => {
    if (carregando || !hasMore) return;

    setCarregando(true);

    try {
      const response = await fetch(`https://rickandmortyapi.com/api/character?page=${paginaAtual}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar os dados');
      }
      const data = await response.json();

      setTodosPersonagens((prev) => [...prev, ...data.results]);
      setHasMore(data.info.next !== null);
      setPaginaAtual((prev) => prev + 1);
    } catch (error) {
      console.error('Erro na requisição:', error);
    } finally {
      setCarregando(false);
    }
  };

  const handleSearch = (termo: string) => {
    setTermoBusca(termo);

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      realizarBusca(termo);
    }, 300);
  };

  const realizarBusca = async (termo: string) => {
    setCarregando(true);

    try {
      const response = await fetch(`https://rickandmortyapi.com/api/character/?name=${termo}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar os dados');
      }
      const data = await response.json();
      setTodosPersonagens(data.results);
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setCarregando(false);
    }
  };

  const resetSearch = () => {
    setTermoBusca('');
    carregarPersonagens();
  };

  const showCharacterDetails = (character: Character) => {
    setPersonagemSelecionado(character);
  };

  const toggleFavorito = (id: number) => {
    const novosFavoritos = { ...favoritos };
    novosFavoritos[id] = !novosFavoritos[id];
    setFavoritos(novosFavoritos);
  };

  const salvarFavoritos = async () => {
    try {
      await AsyncStorage.setItem('favoritos', JSON.stringify(favoritos));
    } catch (error) {
      console.error('Erro ao salvar os favoritos:', error);
    }
  };

  const carregarFavoritos = async () => {
    try {
      const favoritosSalvos = await AsyncStorage.getItem('favoritos');
      if (favoritosSalvos) {
        setFavoritos(JSON.parse(favoritosSalvos));
      }
      setFavoritosCarregados(true);
    } catch (error) {
      console.error('Erro ao carregar os favoritos:', error);
    }
  };

  const renderItem = ({ item }: { item: Character }) => (
    <TouchableOpacity onPress={() => showCharacterDetails(item)}>
      <View style={styles.card}>
        <Image source={{ uri: item.image }} style={styles.imagem} resizeMode="cover" />
        <View style={styles.infoContainer}>
          <View style={styles.rowContainer}>
            <Text style={styles.nome}>{item.name}</Text>
            <TouchableOpacity onPress={() => toggleFavorito(item.id)}>
              <Ionicons
                name={favoritos[item.id] ? 'heart' : 'heart-outline'}
                size={24}
                color={favoritos[item.id] ? 'red' : 'black'}
                style={{ marginLeft: 10 }}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.info}>{item.species}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    return (
      carregando && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )
    );
  };

  return (
    <View style={styles.container}>
      <AppBar />
      <View style={styles.tituloContainer}>
        <Image
          source={require('@/assets/images/titulo.png')}
          style={styles.tituloImage}
          resizeMode="contain"
        />
      </View>
      <SearchBar onSearch={handleSearch} onClear={resetSearch} />

      {personagemSelecionado ? (
        <View style={styles.detailContainer}>
          <TouchableOpacity onPress={() => setPersonagemSelecionado(null)} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Fechar Detalhes</Text>
          </TouchableOpacity>
          <View style={styles.detailContent}>
            <Image source={{ uri: personagemSelecionado.image }} style={styles.detailImage} resizeMode="cover" />
            <View style={styles.infoContainer}>
              <Text style={styles.nome}>{personagemSelecionado.name}</Text>
              <Text style={styles.info}>{personagemSelecionado.status}</Text>
              <Text style={styles.info}>{personagemSelecionado.gender}</Text>
              <Text style={styles.info}>{personagemSelecionado.species}</Text>
            </View>
          </View>
        </View>
      ) : (
        <FlatList
          data={todosPersonagens}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.id}`}
          onEndReached={carregarPersonagens}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.contentContainer}
        />
      )}
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tituloContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  tituloImage: {
    width: 312,
    height: 104,
  },
  card: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    flexDirection: 'row',
  },
  imagem: {
    width: 120,
    height: 120,
    borderRadius: 5,
  },
  infoContainer: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nome: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  info: {
    fontSize: 16,
  },
  loader: {
    marginTop: 10,
    alignItems: 'center',
  },
  contentContainer: {
    paddingHorizontal: 10,
  },
  detailContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  detailContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
  },
  detailImage: {
    width: 120,
    height: 120,
    borderRadius: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 10,
    backgroundColor: '#ccc',
    borderRadius: 5,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
