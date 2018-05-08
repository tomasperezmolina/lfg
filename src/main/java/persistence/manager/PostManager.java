package persistence.manager;

import org.jetbrains.annotations.NotNull;
import persistence.manager.generator.KeyGenerator;
import persistence.model.Activity;
import persistence.model.Group;
import persistence.model.Post;
import persistence.model.User;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import javax.persistence.EntityManager;
import javax.persistence.EntityTransaction;
import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * @author Tomas Perez Molina
 */

@ApplicationScoped
public class PostManager {
    private EntityManager manager;
    private KeyGenerator generator;

    @Inject
    public PostManager(EntityManager manager, KeyGenerator generator) {
        this.manager = manager;
        this.generator = generator;
    }

    public PostManager(){ }

    public int addPost(String description,
                        @NotNull LocalDateTime date,
                        Activity activity,
                        @NotNull User owner)
    {
        EntityTransaction tx = manager.getTransaction();
        int id = generator.generate("post");
        Post post = new Post(id, description, date, activity, owner);

        try {
            tx.begin();
            manager.persist(post);
            tx.commit();
        } catch (Exception e) {
            if (tx!=null) tx.rollback();
            e.printStackTrace();
        }

        return post.getId();
    }

    public int addGroupPost(String description,
                             @NotNull LocalDateTime date,
                             @NotNull Group group)
    {
        EntityTransaction tx = manager.getTransaction();
        int id = generator.generate("post");
        Post post = new Post(id, description, date, group);

        try {
            tx.begin();
            manager.persist(post);
            tx.commit();
        } catch (Exception e) {
            if (tx!=null) tx.rollback();
            e.printStackTrace();
        }

        return post.getId();
    }

    public void deletePost(int postID){
        EntityTransaction tx = manager.getTransaction();
        try {
            tx.begin();
            Post post = manager.find(Post.class, postID);
            manager.remove(post);
            tx.commit();
        } catch (NullPointerException | IllegalArgumentException exc){
            if (tx!=null) tx.rollback();
            throw new NoSuchElementException();
        } catch (Exception e) {
            if (tx!=null) tx.rollback();
            e.printStackTrace();
        }
    }

    @SuppressWarnings("unchecked")
    public List<Post> listPosts(){
        return manager.createQuery("FROM Post").getResultList();
    }

    public void wipeAllRecords(){
        listPosts().stream().map(Post::getId).forEach(this::deletePost);
//        EntityTransaction tx = manager.getTransaction();
//        try {
//            tx.begin();
//            manager.createQuery("DELETE FROM Post").executeUpdate();
//            tx.commit();
//        } catch (Exception e) {
//            if (tx!=null) tx.rollback();
//            e.printStackTrace();
//        }
    }

    public Post getPost(int postID){
        return manager.find(Post.class, postID);
    }
}
