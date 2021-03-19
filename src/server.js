const ApolloServer = require("apollo-server").ApolloServer;
const ApolloServerLambda = require("apollo-server-lambda").ApolloServer;
const { gql } = require("apollo-server-lambda");

const admin = require("firebase-admin");

require("dotenv").config();

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(
      JSON.stringify({
        type: process.env.FIREBASE_TYPE,
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_URL
      })
    )
  )
});

const typeDefs = gql`
  type Video {
    id: ID
    description: String
    videoUrl: String
    subtitle: String
    thumb: String
    name: String
    slug: String
    duration: Int
    sort: Int
    isCompleted: Boolean
    category: String
  }

  type Sections {
    id: ID!
    name: String
    sort: Int
    videos: [Video]
  }

  type Query {
    hello: String
    # video(id: ID!): Video
    videos: [Video]
    sections: [Sections]
  }
`;

const resolvers = {
  Query: {
    hello: () => "Hola desde Cali - La Sucursal del Cielo 🤠.",
    sections: async () => {
      const sections = await admin
        .firestore()
        .collection("sections")
        .get();

      sections.docs.forEach(section =>
        console.log(section.id, "=>", section.data())
      );

      return sections.docs.map(section => section.data());
    },
    videos: async () => {
      const videos = await admin
        .firestore()
        .collection("sections")
        .doc("1")
        .collection("videos")
        .get();

      videos.forEach(video => {
        console.log("Found video with name:", video.data().name);
      });

      return videos.docs.map(video => video.data());
    }
  }
};

function createLambdaServer() {
  return new ApolloServerLambda({
    typeDefs,
    resolvers,
    introspection: true,
    playground: true
  });
}

function createLocalServer() {
  return new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    playground: true
  });
}

module.exports = { createLambdaServer, createLocalServer };
