import Head from 'next/head'
import Link from 'next/link'
import { gql } from '@apollo/client';

import { getApolloClient } from 'lib/apollo-client';

import styles from '../../styles/Home.module.css'

export default function Post({ post, site, video }) {
  return (
    <div className={styles.container}>
      <Head>
        <title>{ post.title }</title>
        <meta name="description" content={`Read more about ${post.title} on ${site.title}`} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          { post.title }
        </h1>

        {video && (
          <figure>
            <div dangerouslySetInnerHTML={{
              __html: video.oEmbed.html
            }} />
            <figcaption>From { video.videoSource }</figcaption>
          </figure>
        )}

        <div className={styles.grid}>
          <div className={styles.content} dangerouslySetInnerHTML={{
            __html: post.content
          }} />
        </div>

        <p className={styles.backToHome}>
          <Link href="/">
            <a>
              &lt; Back to home
            </a>
          </Link>
        </p>
      </main>
    </div>
  )
}

export async function getStaticProps({ params = {} } = {}) {
  const { postSlug } = params;

  const apolloClient = getApolloClient();

  const data = await apolloClient.query({
    query: gql`
      query PostBySlug($slug: String!) {
        generalSettings {
          title
        }
        postBy(slug: $slug) {
          id
          content
          title
          slug
          video {
            videoSource
            videoUrl
          }
        }
      }
    `,
    variables: {
      slug: postSlug
    }
  });

  const post = data?.data.postBy;
  let oEmbed;

  if ( post.video ) {
    if ( post.video.videoSource === 'YouTube') {
      oEmbed = await fetch(`https://www.youtube.com/oembed?url=${post.video.videoUrl}`)
      oEmbed = await oEmbed.json();
    }
  }

  const site = {
    ...data?.data.generalSettings
  }

  return {
    props: {
      post,
      site,
      video: {
        ...post.video,
        oEmbed
      }
    }
  }
}

export async function getStaticPaths() {
  const apolloClient = getApolloClient();

  const data = await apolloClient.query({
    query: gql`
      {
        posts(first: 10000) {
          edges {
            node {
              id
              title
              slug
            }
          }
        }
      }
    `,
  });

  const posts = data?.data.posts.edges.map(({ node }) => node);

  return {
    paths: posts.map(({ slug }) => {
      return {
        params: {
          postSlug: slug
        }
      }
    }),
    fallback: false
  }
}