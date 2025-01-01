import { db } from '@/firebase/firebaseConfig';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';

export async function POST(req) {
  const { title, content, author, imageUrl } = await req.json();

  try {
    const docRef = await addDoc(collection(db, 'blogs'), {
      title,
      content,
      author,
      imageUrl,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return Response.json({ success: true, id: docRef.id });
  } catch (error) {
    return Response.json({ success: false, error: error.message });
  }
}

export async function GET() {
  try {
    const querySnapshot = await getDocs(collection(db, 'blogs'));
    const blogs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return Response.json(blogs);
  } catch (error) {
    return Response.json({ success: false, error: error.message });
  }
}
